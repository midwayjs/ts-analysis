interface IResult {
    success: boolean;
    data: number[];
}
export declare class Test {
    private ctx;
    private oth;
    constructor(name: string, age: number);
    handler(event: {
        d: {
            name: string;
        };
        name: string;
    }): Promise<IResult>;
}
export {};
