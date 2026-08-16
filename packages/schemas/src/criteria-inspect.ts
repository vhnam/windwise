type SchemaNode = {
  type: string;
  wrapped?: SchemaNode;
  item?: SchemaNode;
  options?: readonly string[];
};

function asNode(schema: unknown): SchemaNode {
  return schema as SchemaNode;
}

export function unwrapCriteriaSchema(schema: unknown): SchemaNode {
  const node = asNode(schema);
  if (node.type === 'optional' && node.wrapped) {
    return unwrapCriteriaSchema(node.wrapped);
  }
  return node;
}

export function isOptionalCriteriaSchema(schema: unknown): boolean {
  return asNode(schema).type === 'optional';
}

export function isArrayCriteriaSchema(schema: unknown): boolean {
  return unwrapCriteriaSchema(schema).type === 'array';
}

export function criteriaPicklistOptions(schema: unknown): string[] | undefined {
  const inner = unwrapCriteriaSchema(schema);
  if (inner.type === 'picklist' && inner.options) {
    return [...inner.options];
  }
  if (inner.type === 'array' && inner.item?.type === 'picklist' && inner.item.options) {
    return [...inner.item.options];
  }
  return undefined;
}
