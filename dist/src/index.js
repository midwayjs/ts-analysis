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
exports.tsAnalysisInstance = exports.TsAnalysis = void 0;
const ts = require("typescript");
const globx_1 = require("./utils/globx");
class TsAnalysis {
    constructor(sourcePath) {
        this.result = this.initResult();
        this.sourcePath = sourcePath;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const rootNames = globx_1.globx(this.sourcePath, 2, ['.ts']);
            const compilerOptions = this.getTsConfigInfo();
            const program = ts.createProgram(rootNames, compilerOptions);
            this.checker = program.getTypeChecker();
            for (const sourceFile of program.getSourceFiles()) {
                if (!sourceFile.isDeclarationFile) {
                    ts.forEachChild(sourceFile, this.visit.bind(this));
                }
            }
            return;
        });
    }
    getResult() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.result;
        });
    }
    visit(node, parent) {
        const currentInfo = this.initResult();
        const target = this.analysisNode(node);
        if (node.decorators) {
            currentInfo.decorator = this.analysisDecorator(node, target, parent === null || parent === void 0 ? void 0 : parent.decorator);
            this.assignDecoratorsToResult(currentInfo.decorator, this.result.decorator);
        }
        if (target.type === 'class') {
            const symbol = this.checker.getSymbolAtLocation(node.name);
            if (symbol === null || symbol === void 0 ? void 0 : symbol.members) {
                symbol.members.forEach((member) => {
                    var _a;
                    if ((_a = member === null || member === void 0 ? void 0 : member.declarations) === null || _a === void 0 ? void 0 : _a[0]) {
                        this.visit(member.declarations[0], currentInfo);
                    }
                });
            }
        }
    }
    getSourceFileText(nodeOrigin) {
        let node = nodeOrigin;
        while (!ts.isSourceFile(node) && node.parent) {
            node = node.parent;
        }
        return node.getText();
    }
    analysisNode(node) {
        var _a, _b;
        let type = '';
        let params;
        let response;
        const name = ((_b = (_a = node) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.escapedText) || '';
        const code = this.getSourceFileText(node);
        if (ts.isClassDeclaration(node)) {
            type = 'class';
        }
        else if (ts.isMethodDeclaration(node)) {
            type = 'method';
            params = node.parameters.map((param) => {
                const symbolParams = this.checker.getSymbolAtLocation(param.name);
                return this.getParamType(symbolParams);
            });
            const symbol = this.checker.getSymbolAtLocation(node.name);
            const { checkerType } = this.getType(symbol);
            const signatures = checkerType.getCallSignatures()[0];
            response = this.serializeType(signatures.getReturnType());
        }
        else if (ts.isConstructorDeclaration(node)) {
            type = 'constructor';
        }
        else if (ts.isPropertyDeclaration(node)) {
            type = 'property';
        }
        else {
        }
        const target = {
            type,
            name,
            params,
            response,
            position: {
                start: this.getPosition(code, node.pos),
                end: this.getPosition(code, node.end),
            },
        };
        return target;
    }
    analysisDecorator(node, target, parent) {
        const sourceFile = node.getSourceFile();
        const sourceInfo = {
            sourceFile: sourceFile.fileName,
        };
        const currentDecoratorTypeMap = {};
        node.decorators.forEach((decorator) => {
            if (ts.isCallExpression(decorator.expression)) {
                const expressionInfo = this.getExpressionInfo(node, decorator.expression, sourceInfo);
                if (expressionInfo) {
                    const name = expressionInfo.expressionName;
                    const decoratorInfo = {
                        name,
                        target,
                        sourceFile: sourceInfo.sourceFile,
                        params: expressionInfo.params,
                        position: expressionInfo.position,
                    };
                    if (!currentDecoratorTypeMap[name]) {
                        currentDecoratorTypeMap[name] = [];
                    }
                    currentDecoratorTypeMap[name].push(decoratorInfo);
                }
            }
        });
        if (parent) {
            Object.keys(parent).forEach((parentDecoName) => {
                const decoList = parent[parentDecoName];
                if (Array.isArray(decoList)) {
                    decoList.forEach((decoInfo) => {
                        if (!decoInfo.childDecorators) {
                            decoInfo.childDecorators = {};
                        }
                        this.assignDecoratorsToResult(currentDecoratorTypeMap, decoInfo.childDecorators);
                    });
                }
            });
        }
        return currentDecoratorTypeMap;
    }
    getExpressionInfo(node, expression, sourceInfo) {
        var _a;
        if (!(expression === null || expression === void 0 ? void 0 : expression.expression) || !ts.isCallExpression(expression)) {
            return;
        }
        const code = this.getSourceFileText(node);
        let params = [];
        if ((_a = expression.arguments) === null || _a === void 0 ? void 0 : _a.length) {
            params = this.formatParams(expression.arguments);
        }
        const expressionName = expression.expression.escapedText.toString();
        return {
            expressionName,
            params,
            position: {
                start: this.getPosition(code, expression.pos),
                end: this.getPosition(code, expression.end),
            },
        };
    }
    assignDecoratorsToResult(currentDecoratorTypeMap, target) {
        Object.keys(currentDecoratorTypeMap).forEach((decoratorName) => {
            if (!target[decoratorName]) {
                target[decoratorName] = [];
            }
            target[decoratorName].push(...currentDecoratorTypeMap[decoratorName]);
        });
    }
    getPosition(code, pos) {
        var _a;
        try {
            const codeArr = code.substr(0, pos).split('\n');
            const ln = codeArr.length - 1;
            return {
                ln,
                col: ((_a = codeArr[ln]) === null || _a === void 0 ? void 0 : _a.length) || 0,
            };
        }
        catch (e) {
            return { ln: 0, col: 0 };
        }
    }
    formatParams(args) {
        return args.map((arg) => {
            if (arg.name) {
                return arg.name.escapedText;
            }
            if (arg.text) {
                return arg.text;
            }
            if (arg.symbol) {
                const symbol = this.getParamValule(arg.symbol);
                return symbol;
            }
            if (arg.elements) {
                return this.formatParams(arg.elements);
            }
            return '';
        });
    }
    getParamValule(symbol) {
        var _a, _b, _c;
        const { type } = this.getType(symbol);
        const valueDeclaration = symbol.valueDeclaration;
        if (type === 'string') {
            if (valueDeclaration.initializer) {
                return ((_a = valueDeclaration.initializer) === null || _a === void 0 ? void 0 : _a.text) || ((_c = (_b = valueDeclaration.initializer) === null || _b === void 0 ? void 0 : _b.name) === null || _c === void 0 ? void 0 : _c.escapedText) || '';
            }
        }
        const param = {};
        if (symbol.members) {
            symbol.members.forEach((value, key) => {
                param[key] = this.getParamValule(value);
            });
        }
        return param;
    }
    getParamType(symbol) {
        var _a;
        const checkerType = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        const parameter = Object.assign(Object.assign({}, this.serializeType(checkerType)), { name: ((_a = symbol === null || symbol === void 0 ? void 0 : symbol.getName) === null || _a === void 0 ? void 0 : _a.call(symbol)) || '', desc: ts.displayPartsToString(symbol.getDocumentationComment(this.checker)) });
        return parameter;
    }
    serializeType(checkerType) {
        const parameter = {};
        const checker = this.checker;
        const type = this.checker.typeToString(checkerType).toLowerCase();
        if (checkerType.value !== undefined) {
            parameter.fixed = checkerType.value;
            parameter.type = typeof parameter.fixed;
        }
        else if (['string', 'number', 'boolean', 'any', 'object', 'array'].indexOf(type) !== -1) {
            parameter.type = type;
        }
        else if (['true', 'false'].indexOf(type) !== -1) {
            parameter.type = 'boolean';
            parameter.fixed = type === 'true';
        }
        else if (checkerType.isClassOrInterface()) {
            parameter.type = 'object';
            parameter.properties = {};
            checkerType
                .getProperties()
                .map((symbol) => this.getParamType(symbol))
                .forEach((item) => {
                parameter.properties[`${item.name}`] = item;
            });
        }
        else if (checkerType.isUnion()) {
            if (checkerType.intrinsicName === 'boolean') {
                parameter.type = 'boolean';
            }
            else if (checkerType.symbol && checkerType.symbol.valueDeclaration.kind === 244) {
                parameter.type = 'int32';
                parameter.enum = checkerType.types.map((item) => {
                    return {
                        label: item.symbol.getName(),
                        value: item.value,
                    };
                });
            }
            else {
                let oneType = '';
                parameter.$oneof = checkerType.types.map((item) => {
                    const childType = this.serializeType(item);
                    if (!type) {
                        oneType = childType.type;
                    }
                    else if (type !== childType.type) {
                        oneType = 'any';
                    }
                    return childType;
                });
                parameter.type = oneType || 'any';
            }
        }
        else if (checker.isArrayType && checker.isArrayType(checkerType)) {
            parameter.type = 'array';
            const itemType = checkerType.typeArguments.map((item) => {
                return this.serializeType(item);
            });
            parameter.items = Object.assign({}, itemType[0]);
        }
        else if (checker.getPromisedTypeOfPromise && checker.getPromisedTypeOfPromise(checkerType)) {
            const promiseType = checker.getPromisedTypeOfPromise(checkerType);
            return this.serializeType(promiseType);
        }
        else {
            if (checkerType.getProperties) {
                const properties = checkerType.getProperties();
                if (properties && properties.length) {
                    parameter.type = 'object';
                    parameter.properties = {};
                    properties.map((symbol) => this.getParamType(symbol)).forEach((item) => {
                        parameter.properties[`${item.name}`] = item;
                    });
                    return parameter;
                }
            }
            else {
                parameter.type = type;
            }
        }
        return parameter;
    }
    getType(symbol) {
        const checkerType = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        return {
            type: this.checker.typeToString(checkerType).toLowerCase(),
            checkerType,
        };
    }
    initResult() {
        return {
            decorator: {},
        };
    }
    getTsConfigInfo() {
        return {};
    }
}
exports.TsAnalysis = TsAnalysis;
exports.tsAnalysisInstance = (sourcePath) => __awaiter(void 0, void 0, void 0, function* () {
    const analysisInstance = new TsAnalysis(sourcePath);
    yield analysisInstance.start();
    return analysisInstance.getResult();
});
