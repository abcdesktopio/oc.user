/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

const supertest       = require("supertest");
const WebSocketClient = require('ws');
const request         = supertest(`http://${process.env.CONTAINER_IP}:29781`);
const buri            = `ws://${process.env.CONTAINER_IP}:29781`;

async function* sendMessage(pid) {
    let ws = new WebSocketClient(`${buri}/terminals/${pid}`);
    
    yield new Promise((resolve, reject) => {
        ws.on("open", () => {
          resolve();  
        });

        ws.on("error", error => {
            reject(error);
            ws = null;
        });
    });

    ws.send(yield); //Expect the exit message

    yield new Promise(resolve => {
        ws.on("close", () => {
            resolve(ws = null);
        });
    });
}

describe("Test xterm.js endpoint", () => {
    describe("Test endpoint terminals", () => {
        
        it ("Should get forbiden because of no cols provided", () => {
            const expected = { 
                errors: [ 
                    { location:'query', param:'cols', msg:'No cols provided' },
                    { location:'query', param:'rows', msg:'No rows provided' } 
                ]
            };

            return request
                .post("/terminals")
                .expect(422)
                .expect(expected);
        });

        it ("Should get forbiden because of invalid cols provided", () => {
            const expected = { 
                errors: [ 
                    { location:'query', msg:'Cols must be a number', param:'cols', value:'test',},
                    { location:'query', msg:'No rows provided', param:'rows' }
                ]
            };

            return request
                .post("/terminals")
                .query({ cols:'test' })
                .expect(422)
                .expect(expected);
        });

        it ("Should get forbiden because of no rows provided", () => {
            const expected = { errors:[ { location:'query', param:'rows', msg:'No rows provided' } ] }
            return request
                .post("/terminals")
                .query({ cols:100 })
                .expect(422)
                .expect(expected);
        });

        it ("Should get forbiden because of invalid rows provided", () => {
            const expected = { errors:[ { location:'query', param:'rows', msg:'Rows must be a number', value:'test', } ] }
            return request
                .post("/terminals")
                .query({ cols:100, rows:'test' })
                .expect(422)
                .expect(expected);
        });

        it ("Should get not found because of pid not found", () => {
            const expected = { code:404, data:'Pid not found' };
            return request
                .post(`/terminals/${0}/size`)
                .query({ cols:100, rows:100 })
                .expect(404)
                .expect(expected);
        });

        for (let i = 0; i < 5; i++) {
            let pid;
            it ("Should create a terminal", () => {
                return request
                    .post("/terminals")
                    .query({ cols:50, rows:50 })
                    .expect(200)
                    .expect(res => {
                        expect(!isNaN(res.body)).toBe(true);
                        pid = res.body;
                    });
            });

            it ("Should resize the window", () => {
                const expected = { code:200, data:'ok' };
                return request
                    .post(`/terminals/${pid}/size`)
                    .query({ cols:100, rows:100 })
                    .expect(200)
                    .expect(expected);
            });

            it ("Should close terminal", async () => {
                const gen = sendMessage(pid);
                await gen.next(); //Go to first yield
                await gen.next(); //Connected
                await gen.next("exit\n");
                const { done } = await gen.next();
                expect(done).toBe(true);
            }, 5000);
        }
    });
});