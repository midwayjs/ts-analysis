"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const path_1 = require("path");
const assert = require("assert");
describe('/test/code.test.ts', () => {
    it('analysis', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield src_1.tsAnalysisInstance(path_1.resolve(__dirname, './fixtures/decorator'));
        assert(result.decorator.Provider[0].target.type === 'class');
        assert(result.decorator.Provider[0].target.name === 'Test');
        assert(result.decorator.Provider[0].childDecorators.Func[0].target.type === 'method');
        assert(result.decorator.Provider[0].childDecorators.Func[0].target.name === 'handler');
    }));
});
