import { resolve } from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
export const globx = (dirname: string, mod: number, filter: string[], notCheckExists?: boolean) => {
  if (!notCheckExists && !existsSync(dirname)) {
    return [];
  }
  const list = readdirSync(dirname);
  const result = [];
  list.forEach(file => {
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
          childs
        });
      }
    } else {
      // 过滤
      if (filter) {
        const find = filter.find(filter => {
          return file.endsWith(filter);
        });
        if (!find) {
          return;
        }
      }
      result.push(mod === 2 ? resolvePath : {
        type: 'file',
        name: file,
        path: resolvePath
      });
    }
  });
  return result;
};