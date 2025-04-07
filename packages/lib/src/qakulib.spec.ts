import { expect } from 'chai';
import { Qaku } from './qakulib.js';
import { createLightNode } from '@waku/sdk';

import "fake-indexeddb/auto";

import { LocalStorage } from "node-localstorage";
import {  EnhancedQuestionMessage, QakuEvents, QuestionShow, QuestionSort, } from './types.js';
global.localStorage = new LocalStorage('./scratch');



describe('Qaku', () => {
  let q:Qaku | undefined = undefined
  beforeEach(async () => {
    const node = await createLightNode({
      defaultBootstrap: false,
      networkConfig: {shards: [0], clusterId: 42},
      bootstrapPeers: ["/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/8000/wss/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb"]
    })
    await node.start()
    q = new Qaku(node);
  })

 /* it('dispatcher should initialized', async () => {
    const node = await createLightNode({defaultBootstrap: true , networkConfig: DefaultNetworkConfig})
    await node.start()
    const q = new Qaku(node);
    await q.init("tmp")
    expect(q.loading).to.equal(false);
    expect(q.dispatcher).not.equal(null)
    await q.destroy()
  });*/
/*
  it('publish a question', async () => {
    const node = await createLightNode({defaultBootstrap: true , networkConfig: DefaultNetworkConfig})
    await node.start()
    const q = new Qaku(node);
    q.on(QakuEvents.QAKU_STATE_UPDATE, (arg) => {
      console.log("New state: ", arg)
    })

    await q.init("X9efdcdfb560e", "abcdefg")
    expect(q.dispatcher).not.equal(null)

    await new Promise((r) => setTimeout(r, 1000))
    expect(q.controlState!.id).to.equal("7bbcc32a5339")


    q.on(QakuEvents.NEW_QUESTION_PUBLISHED, (arg) => {
      console.log(arg)
    })
    await q.newQuestion(`Does this work? ${Date.now()}`)
    await q.destroy()
  });*/

  it('create a QA', async () => {
    if (!q) throw new Error("Qaku undefined")
    q.on(QakuEvents.QAKU_STATE_UPDATE, (arg) => {
      console.log("New state: ", arg)
    })

    await q.init()
    expect(q.dispatcher).not.equal(null)

    await new Promise((r) => setTimeout(r, 500))

    const password = "abcdefg"
    const id = await q.newQA("TEst from lib", "Something", true, [], false, password)
    console.log(`https://qaku.app/q/${id}/${password}`)


    q.on(QakuEvents.NEW_QUESTION, (hash) => {
      console.log("New question: ", hash)
    })

    q.on(QakuEvents.NEW_ANSWER_PUBLISHED, (hash) => {
      console.log("New answer published for Q: ", hash)
    })
    const qHash = await q.newQuestion(id, `Does this work? ${Date.now()}`)
    expect(qHash).not.equal(undefined)
    await new Promise((r) => setTimeout(r, 1000))
    await q.answer(qHash!, "It might")

    await new Promise((r) => setTimeout(r, 20000))

  });



  it("should sort messages properly", async () => {
    if (!q) throw new Error("Qaku undefined")

    const data = new Map<string, EnhancedQuestionMessage>()
    
    data.set('a487dfbcc60618b1ad81cba048ed4c84e7b511385bd9603e41c4d9bd17e1175b', {
      hash: 'a487dfbcc60618b1ad81cba048ed4c84e7b511385bd9603e41c4d9bd17e1175b',
      question: 'Does this work? 1740662086981',
      timestamp: new Date('2025-02-27T13:14:46.982Z'),
      moderated: false,
      answer: 'It might',
      answered: true,
      answeredBy: '0x0f13BF2856681d4673A75d41a22bdF18a2700841',
      upvotedByMe: false,
      upvotes: 0,
      upvoters: [],
      signer: undefined,
    })

    data.set('ab', {
      hash: 'ab',
      question: 'Time +1h',
      timestamp: new Date('2025-02-27T14:14:46.982Z'),
      moderated: true,
      answer: undefined,
      answered: false,
      answeredBy: '0x0f13BF2856681d4673A75d41a22bdF18a2700841',
      upvotedByMe: false,
      upvotes: 0,
      upvoters: [],
      signer: undefined,
    })

    data.set('xx', {
      hash: 'xx',
      question: 'Upvoted',
      timestamp: new Date('2025-02-27T13:14:46.982Z'),
      moderated: false,
      answer: undefined,
      answered: false,
      answeredBy: '0x0f13BF2856681d4673A75d41a22bdF18a2700841',
      upvotedByMe: false,
      upvotes: 1,
      upvoters: ['0xAAAAAF2856681d4673A75d41a22bdF18a2700841'],
      signer: undefined,
    })

    data.set('xy', {
      hash: 'xy',
      question: 'Upvoted',
      timestamp: new Date('2025-02-28T13:14:46.982Z'),
      moderated: false,
      answer: 'It might',
      answered: true,
      answeredBy: '0x0f13BF2856681d4673A75d41a22bdF18a2700841',
      upvotedByMe: false,
      upvotes: 1,
      upvoters: ['0xAAAAAF2856681d4673A75d41a22bdF18a2700841'],
      signer: undefined,
    })


    q.on(QakuEvents.QAKU_STATE_UPDATE, (arg) => {
      console.log("New state: ", arg)
    })
    await q.init()

    const id = "abc"

    q.qas.set(id, {dispatcher: null, controlState: undefined, polls: [], questions: data})


    console.log("Sort TIME DESC", q.getQuestions(id, [QuestionSort.TIME_DESC]))
    console.log("Sort UPVOTES, TIME", q.getQuestions(id, [QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC]))
    console.log("Show ANSWERED", q.getQuestions(id, [QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC], [QuestionShow.ANSWERED]))
    console.log("Show MODERATED", q.getQuestions(id, [QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC], [QuestionShow.MODERATED]))
    console.log("Show ANSWERED + MODERATED", q.getQuestions(id, [QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC], [QuestionShow.ANSWERED, QuestionShow.MODERATED]))

  })
})



