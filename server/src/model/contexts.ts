import type { ContextRec } from "@dme/shared";
import type { Raw } from "./raw";

const groupFields = (g: Raw): string[] => [
  ...(g.keyField ? [g.keyField.name as string] : []),
  ...((g.fields ?? []) as Raw[]).map((f) => f.name as string),
];

/**
 * Looks up a context ("context/location") in the shared definitions: a plain group (its fields), or a composite
 * type made of several groups. A context the definitions do not know is still reported, by name, without fields.
 */
export function makeContextResolver(definitions: Raw | undefined): (dmUri: string) => ContextRec {
  const groups = new Map<string, Raw>(((definitions?.dimensionGroups ?? []) as Raw[]).map((g) => [g.name, g]));
  const types = new Map<string, Raw>(((definitions?.dimensionTypes ?? []) as Raw[]).map((t) => [t.name, t]));

  return (dmUri) => {
    const name = dmUri.includes("/") ? dmUri.slice(dmUri.indexOf("/") + 1) : dmUri;
    const type = types.get(name);
    if (type) {
      return {
        name, composite: true,
        groups: ((type.dimensionGroups ?? []) as string[]).map((gn) => ({ name: gn, fields: groups.has(gn) ? groupFields(groups.get(gn)!) : [] })),
      };
    }
    const group = groups.get(name);
    return { name, composite: false, groups: group ? [{ name, fields: groupFields(group) }] : [] };
  };
}
