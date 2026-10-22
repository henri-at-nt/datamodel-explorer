import type { StoreEntity, StoreGraph, StoreRelation } from "@dme/shared";
import type { Raw } from "./raw";

// Python's \w also matches non-ASCII letters and digits, so this does too.
const ident = (s: unknown) => String(s).replace(/[^\p{L}\p{N}_]/gu, "_");
const quote = (s: unknown) => String(s).replace(/"/g, "'");

/**
 * The store (ClickHouse) overview of one namespace: Kafka topics, NQL tables and objects,
 * and the ClickHouse tables they are stored in. Only what the store model declares is drawn.
 */
export function buildStoreGraph(dm: Raw, sm: Raw): StoreGraph {
  const labels = new Map<string, string>();
  for (const t of [...(dm.timeseries ?? []), ...(dm.objects ?? []), ...(dm.businessConfigObjects ?? []), ...(dm.linkages ?? [])]) {
    labels.set(t.name, t.documentation?.label ?? t.name);
  }
  const nqlTitle = (name: string): string => {
    const label = labels.get(name) ?? name;
    if (label !== name) return label;
    const words = name.replace(/_/g, " ");
    return words.charAt(0).toUpperCase() + words.slice(1);
  };

  const entities = new Map<string, StoreEntity>();
  const relations: StoreRelation[] = [];

  const entity = (id: string, title: string | null, attrs: string[]) => {
    let e = entities.get(id);
    if (!e) {
      e = { id, title: title ?? id, attrs: [] };
      entities.set(id, e);
    }
    for (const a of attrs) if (!e.attrs.includes(a)) e.attrs.push(a);
  };
  const relate = (from: string, to: string, label: string) => relations.push({ from, to, label });

  const mappingAttr = (m: Raw): string => {
    const proto = m.protobufMapping?.fullyQualifiedProtoPath;
    const dmRef = m.dmName || m.dmUri;
    const comment = proto ? `${dmRef} <- ${proto}` : dmRef;
    // No storeName means the column keeps the NQL field name (CHEI default).
    return `string ${ident(m.storeName || dmRef)} "${quote(comment)}"`;
  };

  const tableAttrs = (t: Raw): string[] => {
    const out = [`string name "${quote(t.name)}"`];
    for (const k of ["timeResolution", "signatureResolution", "storageType", "timeZoneType"]) {
      if (k in t) out.push(`string ${k} "${quote(t[k])}"`);
    }
    for (const k of ["ttlInDays", "maxQueryableTimeframeInDays", "defaultQueryableTimeframeInDays"]) {
      if (k in t) out.push(`number ${k} "${t[k]}"`);
    }
    return out;
  };

  const feed = (src: Raw, eid: string) => {
    const topic = src.protobufMapping?.topicName;
    if (!topic) return;
    const tid = "topic_" + ident(topic);
    entity(tid, topic, []);
    relate(tid, eid, "feeds");
  };

  const storedIn = (src: Raw, eid: string) => {
    for (const t of src.tables ?? []) {
      const tid = "tbl_" + ident(t.name);
      entity(tid, `${t.name} · ${t.timeResolution ?? ""} · NQL: ${nqlTitle(src.name)}`, tableAttrs(t));
      relate(eid, tid, "stored in");
    }
  };

  for (const ts of sm.timeseries ?? []) {
    const eid = `st_${ident(ts.name)}`;
    entity(eid, `NQL table: ${nqlTitle(ts.name)}`, []);
    entity(eid, null, [
      ...(ts.timeseriesFieldMappings ?? []).map(mappingAttr),
      ...(ts.metricMappings ?? []).map(mappingAttr),
      ...(ts.associationMapping ?? []).map(mappingAttr),
    ]);
    feed(ts, eid);
    storedIn(ts, eid);
  }

  for (const o of sm.objects ?? []) {
    const eid = `so_${ident(o.name)}`;
    entity(eid, `NQL object: ${nqlTitle(o.name)}`, [`string primaryKeyColumnName "${quote(o.primaryKeyColumnName ?? "")}"`]);
    entity(eid, null, (o.objectFieldMappings ?? []).map(mappingAttr));
    feed(o, eid);
    storedIn(o, eid);
  }

  for (const o of sm.businessConfigObjects ?? []) {
    const eid = `sc_${ident(o.name)}`;
    entity(eid, `NQL config object: ${nqlTitle(o.name)}`, [`string primaryKeyColumnName "${quote(o.primaryKeyColumnName ?? "")}"`]);
    entity(eid, null, (o.objectFieldMappings ?? []).map(mappingAttr));
    feed(o, eid);
    if (o.table) {
      const tid = "tbl_" + ident(o.table);
      entity(tid, `${o.table} · ${o.storageType ?? ""} · NQL: ${nqlTitle(o.name)}`,
        [`string name "${quote(o.table)}"`, `string storageType "${quote(o.storageType ?? "")}"`]);
      relate(eid, tid, "stored in");
    }
  }

  for (const o of sm.linkages ?? []) {
    const eid = `sl_${ident(o.name)}`;
    entity(eid, `NQL linkage: ${nqlTitle(o.name)}`, []);
    entity(eid, null, (o.metricMappings ?? []).map(mappingAttr));
    storedIn(o, eid);
  }

  return { entities: [...entities.values()], relations };
}
