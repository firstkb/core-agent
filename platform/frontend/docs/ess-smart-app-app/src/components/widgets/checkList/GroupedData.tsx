export const groupDataByCategory = (dataObject: Record<number, any>, isCategoryNeeded: boolean): Record<string, any[]> => {
    const groupedData: Record<string, any[]> = {};
  
    Object.values(dataObject).forEach((item) => {
      const category = isCategoryNeeded && item.field1 ? item.field1 : 'MAIN';
      if (!groupedData[category]) {
        groupedData[category] = [];
      }
      groupedData[category].push(item);
    });
  
    const sortedKeys = Object.keys(groupedData).sort((a, b) => a.localeCompare(b));
    const sortedObject: Record<string, any[]> = {};
    sortedKeys.forEach((key) => {
      sortedObject[key] = groupedData[key];
    });
  
    return sortedObject;
  };