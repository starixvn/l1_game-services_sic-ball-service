import { EventConsumers } from "sc-number-game-base";
import { FinishDraw } from "sc-number-game-base/dist/event-consumers/settle-game-round-consumer";
import { SPECIFIC_CHOICE_MAPPER, SPECIFIC_ODDS_MAPPER } from "../constants";
import { getFilterObjectWithAllowedKeys } from "sc-number-game-base/dist/helpers";

export default class SettleGameRoundConsumer extends EventConsumers.SettleGameRoundConsumer {
    async settleRound() {
        const drawResult = this.gameData.result;
        const drawSettlementResult = this.definition.settle(drawResult);
        const { roundId, drawId, exchangeRates } = this.gameData;
        Object.assign(drawResult, { drawId: drawId, time: new Date() });
        Object.assign(drawSettlementResult, { drawId: drawId });

        const roundSettled = await this.roundsRepository.create({
            id: roundId,
            drawId: drawId,
            result: [drawResult],
            settlementResult: [drawSettlementResult],
            time: new Date(),
            exchangeRateId: exchangeRates.exId,
            ended: true,
        });

        if (roundSettled) {
            const finishDraw: FinishDraw = {
                result: drawResult,
                settlementResult: drawSettlementResult,
                roundId: roundSettled.id,
                drawId: roundSettled.drawId,
                time: drawResult.time,
                isLastDraw: roundSettled.ended,
            };
            this.roundResultPublisher.publishRoundResult(finishDraw);
            this.updateRoundData(finishDraw);
            await this.settleBets(finishDraw);
            this.roundResultPublisher.publishWinners(roundId, this.gameData.winningPlayers, drawId);
        }
    }

    updateRoundData(finishDraw: FinishDraw) {
        this.gameData.drawId = finishDraw.drawId + 1;
        this.gameData.roundId = finishDraw.roundId + 1;
    }

    async settleBets(finishDraw: FinishDraw) {
        const bets = await this.queryBets(finishDraw.drawId);

        if (bets?.length) {
            await Promise.all(
                bets.map(async (bet: any) => {
                    const settlementDrawResult = getFilterObjectWithAllowedKeys(finishDraw.settlementResult, this.definition.choices);

                    const odds = this.calculateAndReturnOdds(settlementDrawResult, finishDraw.result.balls, bet.odds);

                    const betResult = this.calculateBetResult(settlementDrawResult, bet, odds);

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;

                    await bet.save();
                    const endGameResult = await this.callEndGame(bet, finishDraw.drawId, finishDraw.time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    if (endGameResult.isOk) {
                        await this.userBetResultPublisher.publish(bet.uid, betResult);
                    }
                })
            );
        }
    }

    async callEndGame(bet: any, roundId: number, time: Date, betResult: any) {
        const { gameInfo, settlementInfo } = this.formatEndGameInfo(bet, roundId, time, betResult);

        const apiResult = await this.endGame(bet.uid, gameInfo, settlementInfo);

        if (!apiResult.isOk) {
            this.userBetResultPublisher.publishApiError(bet.uid, apiResult.response);
        }

        return apiResult;
    }

    calculateAndReturnOdds(settlementDrawResult: Record<string, boolean>, resultBalls: number[], betOdds: Record<string, number>) {
        const odds = { ...settlementDrawResult } as any;

        Object.keys(odds).forEach((choice) => {
            if (this.isSpecificChoice(choice)) {
                const specificMapperKey = resultBalls.filter((ball) => ball === SPECIFIC_CHOICE_MAPPER[choice]).length;
                const specificOddsType = settlementDrawResult[choice] ? SPECIFIC_ODDS_MAPPER[specificMapperKey] : null;
                odds[choice] = specificOddsType ? betOdds[specificOddsType] : 0;
            } else {
                odds[choice] = betOdds[choice];
            }
        });

        return odds;
    }

    isSpecificChoice(choice: string) {
        return choice.includes("specific");
    }
}
