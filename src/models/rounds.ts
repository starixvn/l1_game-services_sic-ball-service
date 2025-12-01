import mongoose from "mongoose";

const modelName = "sicball_rounds";

export type DrawResult = {
    drawId: number;
    balls: number[];
    time: Date;
};

const resultSchema = new mongoose.Schema<DrawResult>(
    {
        drawId: { type: Number, require: true },
        balls: { type: [Number], required: true },
        time: { type: Date, default: new Date() },
    },
    {
        _id: false,
    }
);

export type DrawSettlementResult = {
    drawId: number;
    big: boolean;
    small: boolean;
    specific1: boolean;
    specific2: boolean;
    specific3: boolean;
    specific4: boolean;
    specific5: boolean;
    specific6: boolean;
};

const settlementResultSchema = new mongoose.Schema<DrawSettlementResult>(
    {
        drawId: { type: Number, require: true },
        big: { type: Boolean, default: false },
        small: { type: Boolean, default: false },
        specific1: { type: Boolean, default: false },
        specific2: { type: Boolean, default: false },
        specific3: { type: Boolean, default: false },
        specific4: { type: Boolean, default: false },
        specific5: { type: Boolean, default: false },
        specific6: { type: Boolean, default: false },
    },
    { _id: false }
);

const Schema = new mongoose.Schema({
    id: { type: Number, required: true },
    result: { type: [resultSchema] },
    settlementResult: { type: [settlementResultSchema] },
    time: { type: Date, default: new Date() },
    exchangeRateId: { type: Number, require: true },
    drawId: { type: Number, require: true },
    ended: { type: Boolean, default: false },
});

export default mongoose.model(modelName, Schema);
