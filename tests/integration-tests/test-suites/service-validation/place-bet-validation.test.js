import { GameClientDriver, normalUser, eventTypes } from "sc-game-service-integration-utils";
import gameSettings from "../../_stubs/game-settings";
import { getTimeOutToBetInvalid, getTimeOutToPlacingBetTime, getTimeOutToSettleTime, initUserSession } from "../../helper/helper";
import { socketOptionsFunc } from "../../_stubs/test-data";
import appConfigs from "../../../../build/app-configs.IGT";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("service place bet validation (config: minBet = 1, maxBet = 3000)", () => {
    let client;

    beforeEach(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));

        const sendSignInInterval = setInterval(() => {
            client.sendSignInEvent();
        }, 500);

        await client.handleSignedInEvent();

        client.sendInGameEvent();

        clearInterval(sendSignInInterval);
    });

    afterEach(() => {
        client.close();
        client = null;
    });

    describe("when send invalid bet", () => {
        describe("when bet with stake < 0 ( stake = -1 )", () => {
            it.each(gameSettings.choices)(
                `should show betAmountOfAnyChoiceIncorrect error code for bet { %s : -1 } (#Auto_PB_IVB0_%#)`,
                async (choice) => {
                    // Arrange
                    const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                    const payload = { betChoices: {}, clientSeed: "1234" };

                    payload.betChoices[choice] = -1;

                    setTimeout(() => {
                        client.emit(eventTypes.bet, payload);
                    }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                    // Act
                    const result = await client.handleGameEvent((data) => data.endBet);

                    // Assert
                    expect(result.endBet).toBe(-1);
                    expect(result.notice.errorCode).toBe("SB1925");
                }
            );
        });

        describe("when bet with stake = 0", () => {
            it.each(gameSettings.choices)(
                `should show betAmountOfAnyChoiceIncorrect error code for bet { %s: 0 } (#Auto_PB_IVB1_%#)`,
                async (choice) => {
                    // Arrange
                    const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                    const payload = { betChoices: {}, clientSeed: "1234" };

                    payload.betChoices[choice] = 0;

                    setTimeout(() => {
                        client.emit(eventTypes.bet, payload);
                    }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                    // Act
                    const result = await client.handleGameEvent((data) => data.endBet);

                    // Assert
                    expect(result.endBet).toBe(-1);
                    expect(result.notice.errorCode).toBe("SB1925");
                }
            );
        });

        describe("when bet with stake < min per choice ( stake = 0.5)", () => {
            it.each(gameSettings.choices)(
                `should show betAmountOfAnyChoiceIncorrect error code for bet { %s : 0.5 } (#Auto_PB_IVB2_%#)`,
                async (choice) => {
                    // Arrange
                    const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                    const payload = { betChoices: {}, clientSeed: "1234" };

                    payload.betChoices[choice] = 0.5;

                    setTimeout(() => {
                        client.emit(eventTypes.bet, payload);
                    }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                    // Act
                    const result = await client.handleGameEvent((data) => data.endBet);

                    // Assert
                    expect(result.endBet).toBe(-1);
                    expect(result.notice.errorCode).toBe("SB1925");
                }
            );
        });

        describe("when bet with stake > max bet per choice ( stake = 5000)", () => {
            it.each(gameSettings.choices)(
                `should show maxBetOfAnyChoiceReached error code for bet { %s : 5000 }(#Auto_PB_IVB3_%#)`,
                async (choice) => {
                    // Arrange
                    const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                    const payload = { betChoices: {}, clientSeed: "1234" };

                    payload.betChoices[choice] = 5000;

                    setTimeout(() => {
                        client.emit(eventTypes.bet, payload);
                    }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                    // Act
                    const result = await client.handleGameEvent((data) => data.endBet);

                    // Assert
                    expect(result.endBet).toBe(-1);
                    expect(result.notice.errorCode).toBe("SB1924");
                }
            );
        });

        describe("when bet with stake to reach to total max bet per choice ( 1st bet choice = 1600 then 2nd bet same choice = 1600  )", () => {
            it(`should accept first bet and then show maxBetOfAnyChoiceReached error code for second bet with choice = over (#Auto_PB_IVB4_0)`, async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                const payload = { betChoices: {}, clientSeed: "1234" };

                payload.betChoices["big"] = 1600;

                setTimeout(() => {
                    client.emit(eventTypes.bet, payload);
                }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                const firstBet = await client.handleGameEvent((data) => data.endBet);

                client.sendInGameEvent();

                const inGameData2 = await client.handleGameEvent((data) => data.remainingTime);

                setTimeout(() => {
                    client.emit(eventTypes.bet, payload);
                }, getTimeOutToPlacingBetTime(inGameData2.remainingTime, gameSettings.durations) * 1000);

                const secondBet = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(firstBet.ownBets["big"]).toBeGreaterThanOrEqual(1600);
                expect(secondBet.endBet).toBe(-1);
                expect(secondBet.notice.errorCode).toBe("SB1924");
            });
        });

        describe("when send bet request in block betting time of current round", () => {
            it("should show placeBetNextDraw or cannotPlaceBet error code for bet { big: 10 } (#Auto_PB_IVB5_0)", async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);
                setTimeout(() => {
                    client.emit(eventTypes.bet, { betChoices: { big: 10 }, clientSeed: "1234" });
                }, getTimeOutToBetInvalid(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const result = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(result.endBet).toBe(-1);
                expect(result.notice.errorCode).toEqual(expect.stringMatching(/^(SB1941|SB1906)$/));
            });
        });

        describe("when send bet request in settlement time of current round", () => {
            it("should show placeBetNextDraw error code for bet { big: 10 } (#Auto_PB_IVB5_1)", async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                setTimeout(() => {
                    client.emit(eventTypes.bet, { betChoices: { big: 10 }, clientSeed: "1234" });
                }, getTimeOutToSettleTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const result = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(result.endBet).toBe(-1);
                expect(result.notice.errorCode).toEqual(expect.stringMatching(/^(SB1941|SB1906)$/));
            });
        });

        describe("when bet with stake to reach to total max bet per draw", () => {
            it(`should show maxBetOnDraw error code for bet { big: 2000, specific1: 1500 } (#Auto_PB_IVB5_2)`, async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                const payload = { betChoices: { big: 2000, specific1: 1500 }, clientSeed: "1234" };

                setTimeout(() => {
                    client.emit(eventTypes.bet, payload);
                }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const secondBet = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(secondBet.endBet).toBe(-1);
                expect(secondBet.notice.errorCode).toBe("SB1911");
            });
        });

        describe("when send bet with hedge bet group", () => {
            it(`should show disallowHedgeBet error code for bet { big: 200, small: 100 } (#Auto_PB_IVB5_3)`, async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                const payload = { betChoices: { big: 200, small: 100 }, clientSeed: "1234" };

                setTimeout(() => {
                    client.emit(eventTypes.bet, payload);
                }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const secondBet = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(secondBet.endBet).toBe(-1);
                expect(secondBet.notice.errorCode).toBe("SB1939");
            });
        });

        describe("when send bet 1 bet exceed max bet", () => {
            it(`should show maxBetOfAnyChoiceReached error code for bet { big: 200, specific1: 10000 } (#Auto_PB_IVB5_4)`, async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                const payload = { betChoices: { big: 200, specific1: 10000 }, clientSeed: "1234" };

                setTimeout(() => {
                    client.emit(eventTypes.bet, payload);
                }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const result = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(result.endBet).toBe(-1);
                expect(result.notice.errorCode).toBe("SB1924");
            });
        });

        describe("when send bet request with invalid clientSeed", () => {
            const testCases = [
                {
                    clientSeed: "-1",
                },
                {
                    clientSeed: "0a",
                },
                {
                    clientSeed: "aaaa",
                },
                {
                    clientSeed: "12345",
                },
                {
                    clientSeed: "",
                },
                {
                    clientSeed: "  ",
                },
            ];
            it.each(testCases)(`should show invalid bet error code for bet { big : 100 } (#Auto_PB_IVB6_%#)`, async ({ clientSeed }) => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                const payload = { betChoices: {}, clientSeed: clientSeed };

                payload.betChoices["big"] = 100;

                setTimeout(() => {
                    client.emit(eventTypes.bet, payload);
                }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const result = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(result.endBet).toBe(-1);
                expect(result.notice.errorCode).toBe("SB1935");
            });
        });
    });

    describe("when send valid bet", () => {
        describe("when bet with stake = 100", () => {
            const choices = ["big", "specific1", "specific2", "specific3", "specific4", "specific5", "specific6"];
            it.each(choices)(`should place bet successfully with bet { %s : 100 } (#Auto_PB_VB0_%#)`, async (choice) => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                const payload = { betChoices: {}, clientSeed: "1234" };

                payload.betChoices[choice] = 100;

                setTimeout(() => {
                    client.emit(eventTypes.bet, payload);
                }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const result = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(result.endBet).toBe(100);
                expect(result.ownBets[choice]).toBeGreaterThanOrEqual(100);
            });
        });

        describe("when send bet with multiple choices", () => {
            it(`should place bet successfully for bet { specific1: 100, specific2: 200 } (#Auto_PB_VB1_0)`, async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                const payload = { betChoices: { specific1: 100, specific2: 200 }, clientSeed: "1234" };

                setTimeout(() => {
                    client.emit(eventTypes.bet, payload);
                }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const result = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(result.endBet).toBe(300);
            });
        });

        describe("when send bet with decimal value", () => {
            it("should round bet choice { big : 18.7 } to 18 (#Auto_PB_VB2_0)", async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);
                setTimeout(() => {
                    client.emit(eventTypes.bet, { betChoices: { big: 18.7 }, clientSeed: "1234" });
                }, getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000);

                // Act
                const result = await client.handleGameEvent((data) => data.endBet);

                // Assert
                expect(result.endBet).toBe(18.7);
            });
        });
    });
});
