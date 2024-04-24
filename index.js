import { ObjectId } from "mongodb";
import { connect as connectApp, close as closeApp } from "./config/app_db.js"
import { connect as connectCash, close as closeCash } from "./config/cash_db.js"

async function main() {
    let appDatabase, cashDatabase;

    const documents = {
        cashflowExecuting: { beforeDelete: 0, afterDelete: 0 },
        cashflowControl: { beforeDelete: 0, afterDelete: 0 },
        cashflow: { beforeDelete: 0, afterDelete: 0 },
    }

    try {
        cashDatabase = await connectCash();
        appDatabase = await connectApp();

        const collectionCashFlowExecuting = cashDatabase.collection('cash-flow-executing');
        const collectionUser = appDatabase.collection('user');

        const documentsCashFlowExecuting = await collectionCashFlowExecuting.find().toArray()
        documents.cashflowExecuting.beforeDelete = await collectionCashFlowExecuting.countDocuments()

        const documentsUser = await collectionUser.find().toArray()

        await Promise.all(documentsCashFlowExecuting.map(async cashflowExecuting => {
            const user = documentsUser.find(user => cashflowExecuting.user == user._id.toString())

            if (!user) {
                await collectionCashFlowExecuting.findOneAndDelete({ _id: cashflowExecuting._id })
                documents.cashflowExecuting.afterDelete++
            }
        }))

        const collectionCashFlow = cashDatabase.collection('cash-flow');
        const collectionCashFlowControl = cashDatabase.collection('cash-flow-control');

        documents.cashflow.beforeDelete = await collectionCashFlow.countDocuments()
        documents.cashflowControl.beforeDelete = await collectionCashFlowControl.countDocuments()
        
        const documentsCashFlow = await collectionCashFlow.find().toArray()
        const documentsCashFlowControl = await collectionCashFlowControl.find().toArray()
        
        await Promise.all(documentsCashFlow.map(async cashflow => {
            const user = documentsUser.find(user => cashflow.user == user._id.toString())

            if (!user) {
                await collectionCashFlow.findOneAndDelete({ _id: cashflow._id })
                documents.cashflow.afterDelete++

                await collectionCashFlowControl.findOneAndDelete({ cashFlow: new ObjectId(cashflow._id) })
                documents.cashflowControl.afterDelete++
            }
        }))

        await Promise.all(documentsCashFlowControl.map(async cashflowControl => {
            const exists = documentsCashFlow.find(cashflow => cashflow._id == cashflowControl.cashFlow.toString())

            if (!exists) {
                await collectionCashFlowControl.findOneAndDelete({ _id: cashflowControl._id })
                documents.cashflowControl.afterDelete++
            }
        }))

        console.log('Documents at the end:', documents);

        if (appDatabase) closeApp();
        if (cashDatabase) closeCash();
    } catch (error) {
        console.error('Error:', error);
    }

}

main();