export const getNodeId = (itemType, itemId) => `${itemType}-${itemId}`;

export const getBrokenNodeId = (nodeId) => {
  const broken = nodeId.split('-');
  return {itemType: broken[0], itemId: Number(broken[1])};
};
