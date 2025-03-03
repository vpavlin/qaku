import { expect } from 'chai';
import { Qaku } from './qakulib.js';
import { createLightNode, DefaultNetworkConfig } from '@waku/sdk';

import "fake-indexeddb/auto";

import { LocalStorage } from "node-localstorage";
import {  QakuEvents, } from './types.js';
global.localStorage = new LocalStorage('./scratch');



describe('Qaku', () => {

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
    const node = await createLightNode({defaultBootstrap: true , networkConfig: DefaultNetworkConfig})
    await node.start()
    const q = new Qaku(node);
    q.on(QakuEvents.QAKU_STATE_UPDATE, (arg) => {
      console.log("New state: ", arg)
    })

    await q.init("")
    expect(q.dispatcher).not.equal(null)

    await new Promise((r) => setTimeout(r, 500))

    const password = "abcdefg"
    const id = await q.newQA("TEst from lib", "Something", true, [], false, password)
    console.log(id)
    console.log(`https://qaku.app/q/${id}/${password}`)


    q.on(QakuEvents.NEW_QUESTION_PUBLISHED, (arg) => {
      console.log(arg)
    })

    q.on(QakuEvents.NEW_QUESTION, (hash) => {
      console.log("New question: ", hash)
      console.log(q.questions)
    })

    q.on(QakuEvents.NEW_ANSWER_PUBLISHED, (hash) => {
      console.log("New answer published for Q: ", hash)
      console.log(q.questions)
    })
    const qHash = await q.newQuestion(`Does this work? ${Date.now()}`)
    expect(qHash).not.equal(undefined)
    console.log(qHash)
    await new Promise((r) => setTimeout(r, 1000))
    await q.answer(qHash!, "It might")

    await new Promise((r) => setTimeout(r, 20000))

  });


/*
  it("should sort messages properly", async () => {
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
      upvoters: []
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
      upvoters: []
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
      upvoters: ['0xAAAAAF2856681d4673A75d41a22bdF18a2700841']
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
      upvoters: ['0xAAAAAF2856681d4673A75d41a22bdF18a2700841']
    })

    const node = await createLightNode({defaultBootstrap: true , networkConfig: DefaultNetworkConfig})
    await node.start()
    const q = new Qaku(node);
    q.on(QakuEvents.QAKU_STATE_UPDATE, (arg) => {
      console.log("New state: ", arg)
    })
    await q.init("")

    q.questions = data

    console.log("Sort TIME DESC", q.getQuestions([QuestionSort.TIME_DESC]))
    console.log("Sort UPVOTES, TIME", q.getQuestions([QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC]))
    console.log("Show ANSWERED", q.getQuestions([QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC], [QuestionShow.ANSWERED]))
    console.log("Show MODERATED", q.getQuestions([QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC], [QuestionShow.MODERATED]))
    console.log("Show ANSWERED + MODERATED", q.getQuestions([QuestionSort.UPVOTES_DESC, QuestionSort.TIME_ASC], [QuestionShow.ANSWERED, QuestionShow.MODERATED]))

  })
    */
})



