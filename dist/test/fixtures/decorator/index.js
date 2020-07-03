"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.Test = void 0;
const Provider = () => 0;
const Inject = () => 0;
const Func = () => 0;
const Oth = () => 0;
let Test = class Test {
    constructor(name, age) {
        console.log('init');
    }
    handler(event) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(event.d.name, event.name, this.ctx, this.oth);
            return {
                success: true,
                data: [1, 2, 3],
            };
        });
    }
};
__decorate([
    Inject('context'),
    __metadata("design:type", Object)
], Test.prototype, "ctx", void 0);
__decorate([
    Oth,
    __metadata("design:type", Object)
], Test.prototype, "oth", void 0);
__decorate([
    Func('index.handler', { method: 'GET', path: '/api/test' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Test.prototype, "handler", null);
Test = __decorate([
    Provider(),
    __metadata("design:paramtypes", [String, Number])
], Test);
exports.Test = Test;
