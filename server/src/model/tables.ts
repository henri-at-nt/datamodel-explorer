import type {
  EnumRec, FieldRec, Relation, StoreColumn, StoreTableRec, StructuredRec, TableKind, TableRec, TypeRec,
} from "@dme/shared";
import type { Raw } from "./raw";

const doc = (o?: Raw): Raw => o?.documentation || {};

function fieldRec(f: Raw, role: "field" | "metric"): FieldRec {
  const d = doc(f);
  return {
    name: f.name,
    type: f.dataType ?? "",
    label: d.label ?? "",
    description: d.description ?? "",
    platforms: f.platforms ?? "",
    role,
    ...(f.jsonPath ? { jsonPath: f.jsonPath } : {}),
  };
}

const KEY_PREFIX: Record<Exclude<TableKind, "collection">, string> = {
  timeseries: "ts_", object: "obj_", configObject: "cfg_", linkage: "link_",
};

const byName = (list: Raw[] | undefined): Map<string, Raw> => new Map((list ?? []).map((x) => [x.name, x]));

export interface TablesResult {
  tables: TableRec[];
  types: Record<string, TypeRec>;
  enums: Record<string, EnumRec>;
}

/** Per-table detail for one namespace. `enumDef` finds an enum in any namespace. */
export function buildTables(
  ns: string,
  dm: Raw,
  sm: Raw,
  enumDef: (ns: string, name: string) => Raw | undefined,
): TablesResult {
  const tsTypes = byName(dm.timeseriesTypes);
  const types = byName(dm.types);
  const objects = byName(dm.objects);
  const configObjects = byName(dm.businessConfigObjects);
  const jsonTypes = byName(dm.jsonTypes);
  const storeFor: Record<Exclude<TableKind, "collection">, Map<string, Raw>> = {
    timeseries: byName(sm.timeseries),
    object: byName(sm.objects),
    configObject: byName(sm.businessConfigObjects),
    linkage: byName(sm.linkages),
  };

  /** Key and kind of a referenced type or object; the key is null outside this namespace. */
  const targetOf = (tns: string, name: string): [string | null, string] => {
    if (tns !== ns) return [null, "external"];
    if (tsTypes.has(name)) return [`type_ts_${name}`, "timeseriesType"];
    if (types.has(name)) return [`type_${name}`, "type"];
    if (jsonTypes.has(name)) return [`json_${name}`, "jsonType"];
    if (objects.has(name)) return [`obj_${name}`, "object"];
    if (configObjects.has(name)) return [`cfg_${name}`, "configObject"];
    return [null, "unknown"];
  };

  /** Key of an object or config object this namespace owns, else null (resolved across namespaces later). */
  const objectTarget = (ons: string, name: string): string | null => {
    if (ons !== ns) return null;
    if (objects.has(name)) return `obj_${name}`;
    if (configObjects.has(name)) return `cfg_${name}`;
    return null;
  };

  const typeIndex: Record<string, TypeRec> = {};
  const indexType = (tns: string, name: string): [string | null, string] => {
    const [key, kind] = targetOf(tns, name);
    if (key === null || key in typeIndex) return [key, kind];
    const src = (kind === "timeseriesType" ? tsTypes : kind === "jsonType" ? jsonTypes : types).get(name);
    typeIndex[key] = {
      name,
      kind,
      description: src ? doc(src).description ?? "" : "",
      fields: src
        ? [...[...(src.fields ?? []), ...(src.jsonFields ?? [])].map((f) => fieldRec(f, "field")),
           ...(src.metrics ?? []).map((m: Raw) => fieldRec(m, "metric"))]
        : [],
      structured: (src?.structuredFields ?? []).map((sf: Raw) => ({
        name: sf.name, typeName: sf.typeName, target: targetOf(sf.typeNs, sf.typeName)[0],
      })),
    };
    return [key, kind];
  };

  type SrcKind = Exclude<TableKind, "collection">;
  const tablesSrc: [SrcKind, Raw][] = [
    ...(dm.timeseries ?? []).map((t: Raw) => ["timeseries", t] as [SrcKind, Raw]),
    ...(dm.objects ?? []).map((t: Raw) => ["object", t] as [SrcKind, Raw]),
    ...(dm.businessConfigObjects ?? []).map((t: Raw) => ["configObject", t] as [SrcKind, Raw]),
    ...(dm.linkages ?? []).map((t: Raw) => ["linkage", t] as [SrcKind, Raw]),
  ];

  // Inverse object links: which timeseries and linkages reference each object.
  const inbound = new Map<string, [string, SrcKind, string][]>();
  for (const [kind, t] of tablesSrc) {
    if (kind !== "timeseries" && kind !== "linkage") continue;
    for (const o of t.objects ?? []) {
      if (o.namespace !== ns) continue;
      if (!inbound.has(o.name)) inbound.set(o.name, []);
      inbound.get(o.name)!.push([KEY_PREFIX[kind] + t.name, kind, t.name]);
    }
  }

  const enumUsed = new Map<string, Set<string>>();
  const tables: TableRec[] = [];

  for (const [kind, t] of tablesSrc) {
    const name: string = t.name;
    const fields: FieldRec[] = [
      ...(t.fields ?? []).map((f: Raw) => fieldRec(f, "field")),
      ...(t.metrics ?? []).map((m: Raw) => fieldRec(m, "metric")),
    ];
    const relations: Relation[] = [];
    const structured: StructuredRec[] = [];
    const collectionTables: TableRec[] = [];

    for (const f of fields) {
      if (f.type.startsWith("enumeration/")) {
        const [, ens = "", ename = ""] = f.type.split("/");
        if (!enumUsed.has(ens)) enumUsed.set(ens, new Set());
        enumUsed.get(ens)!.add(ename);
      }
    }

    for (const sf of t.structuredFields ?? []) {
      const [tkey, tkind] = indexType(sf.typeNs, sf.typeName);
      structured.push({
        name: sf.name, typeName: sf.typeName, target: tkey, targetKind: tkind,
        description: doc(sf).description ?? "", label: doc(sf).label ?? "",
      });
      relations.push({
        direction: "out", via: "structured field", label: sf.name, target: tkey, targetName: sf.typeName,
        text: `Structured \`${sf.name}\` block (${tkind} \`${sf.typeName}\`)`,
      });
    }

    // Collections are JSON arrays stored on an object, one element per jsonType. Each also gets a table of its
    // own, because NQL queries it like one (device.cpus).
    for (const c of t.collections ?? []) {
      const [tkey, tkind] = indexType(c.typeNs, c.typeName);
      structured.push({
        name: c.name, typeName: c.typeName, target: tkey, targetKind: tkind,
        collection: true, description: "", label: "",
      });
      const elementType = tkey ? typeIndex[tkey] : undefined;
      const parentKey = KEY_PREFIX[kind] + name;
      const collectionKey = elementType ? `col_${name}_${c.name}` : null;
      if (collectionKey && elementType) {
        collectionTables.push({
          key: collectionKey, kind: "collection", name: `${name}.${c.name}`, collection: c.name,
          label: doc((tkind === "timeseriesType" ? tsTypes : tkind === "jsonType" ? jsonTypes : types).get(c.typeName)).label || c.typeName,
          description: elementType.description, parent: parentKey, meta: {},
          fields: elementType.fields.map((f) => ({ ...f })), structured: [],
          relations: [{
            direction: "in", via: "collection", label: c.name, target: parentKey, targetName: name,
            text: `JSON array \`${c.name}\` on \`${name}\`: each element is one \`${c.typeName}\``,
          }],
          store: { topic: null, tables: [], columns: [] },
        });
      }
      relations.push({
        direction: "out", via: "collection", label: c.name, target: collectionKey ?? tkey, targetName: collectionKey ? `${name}.${c.name}` : c.typeName,
        text: `JSON array \`${c.name}\` of \`${c.typeName}\` (${tkind})`,
      });
    }

    if (kind === "timeseries" || kind === "linkage") {
      for (const o of t.objects ?? []) {
        relations.push({
          direction: "out", via: "object link", label: o.name, target: objectTarget(o.namespace, o.name),
          targetName: o.name, targetNs: o.namespace,
          text: kind === "timeseries"
            ? `Each row links to one \`${o.name}\` object (${o.namespace})`
            : `Each link row relates a \`${o.name}\` (${o.namespace}) to the other linked objects`,
        });
      }
    }
    if (kind === "timeseries") {
      for (const c of t.contexts ?? []) {
        relations.push({
          direction: "out", via: "context", label: c.dmUri, target: null, targetName: c.dmUri,
          text: `Enriched by context \`${c.dmUri}\``,
        });
      }
    }

    if (kind === "object" || kind === "configObject") {
      for (const [srcKey, srcKind, srcName] of inbound.get(name) ?? []) {
        relations.push({
          direction: "in", via: "object link", label: srcName, target: srcKey, targetName: srcName,
          text: srcKind === "timeseries"
            ? `Referenced by timeseries \`${srcName}\`: each of its rows links to one \`${name}\``
            : `Referenced by linkage \`${srcName}\``,
        });
      }
    }

    // Storage (ClickHouse) side of this table.
    const st = storeFor[kind].get(name);
    const store: TableRec["store"] = { topic: null, tables: [], columns: [] };
    if (st) {
      store.topic = st.protobufMapping?.topicName ?? null;
      for (const tb of st.tables ?? []) store.tables.push({ ...tb } as StoreTableRec);
      if (st.table) store.tables.push({ name: st.table, storageType: st.storageType ?? "" });
      const cols: Raw[] = [
        ...(st.timeseriesFieldMappings ?? []), ...(st.metricMappings ?? []),
        ...(st.objectFieldMappings ?? []), ...(st.associationMapping ?? []),
      ];
      for (const m of cols) {
        store.columns.push({
          // No storeName means the column keeps the NQL field name (CHEI default).
          storeName: m.storeName || m.dmName || m.dmUri,
          dmRef: m.dmName || m.dmUri,
          proto: m.protobufMapping?.fullyQualifiedProtoPath ?? "",
        } as StoreColumn);
      }
    }

    const meta: Record<string, string> =
      kind === "timeseries"
        ? {
            timestampField: t.timestampField?.name ?? "",
            entityField: t.entityField?.name ?? "",
            cardinalityMetric: t.cardinalityMetric ?? "",
          }
        : kind === "linkage"
          ? {}
          : { identifier: t.identifier ?? "", lastSeen: t.lastSeen ?? "" };

    tables.push({
      key: KEY_PREFIX[kind] + name, kind, name, collection: t.collectionName ?? "",
      label: doc(t).label ?? name, description: doc(t).description ?? "",
      meta, fields, structured, relations, store,
    });
    tables.push(...collectionTables); // collections follow their parent
  }

  const enums: Record<string, EnumRec> = {};
  for (const [ens, names] of enumUsed) {
    for (const ename of names) {
      const e = enumDef(ens, ename);
      enums[`${ens}/${ename}`] = {
        name: ename, namespace: ens,
        values: (e?.values ?? []).map((v: Raw) => ({
          label: v.label ?? "", value: v.value ?? "", description: v.description ?? "",
        })),
      };
    }
  }

  return { tables, types: typeIndex, enums };
}
