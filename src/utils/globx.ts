import { resolve } from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
export const globx = (dirname: string | string[], mod: number, filter: string[], notCheckExists?: boolean) => {
  if (Array.isArray(dirname)) {
    return [].concat(...dirname.map((dirName: string) => {
      return globx(dirName, mod, filter, notCheckExists);
    }));
  }
  if (!notCheckExists && !existsSync(dirname)) {
    return [];
  }
  const list = readdirSync(dirname);
  const result = [];
  list.forEach((file: string) => {
    const resolvePath = resolve(dirname, file);
    if (statSync(resolvePath).isDirectory()) {
      const childs = globx(resolvePath, mod, filter, true);
      if (mod === 2) {
        result.push(...childs);
      } else {
        result.push({
          type: 'dir',
          name: file,
          path: resolvePath,
          childs,
        });
      }
    } else {
      // 过滤
      if (filter) {
        const find = filter.find((filterItem) => {
          return file.endsWith(filterItem);
        });
        if (!find) {
          return;
        }
      }
      result.push(mod === 2 ? resolvePath : {
        type: 'file',
        name: file,
        path: resolvePath,
      });
    }
  });
  return result;
};
