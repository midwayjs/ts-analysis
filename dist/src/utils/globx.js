"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globx = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
exports.globx = (dirname, mod, filter, notCheckExists) => {
    if (Array.isArray(dirname)) {
        return [].concat(...dirname.map((dirName) => {
            return exports.globx(dirName, mod, filter, notCheckExists);
        }));
    }
    if (!notCheckExists && !fs_1.existsSync(dirname)) {
        return [];
    }
    const list = fs_1.readdirSync(dirname);
    const result = [];
    list.forEach((file) => {
        const resolvePath = path_1.resolve(dirname, file);
        if (fs_1.statSync(resolvePath).isDirectory()) {
            const childs = exports.globx(resolvePath, mod, filter, true);
            if (mod === 2) {
                result.push(...childs);
            }
            else {
                result.push({
                    type: 'dir',
                    name: file,
                    path: resolvePath,
                    childs,
                });
            }
        }
        else {
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
