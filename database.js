const { DBObjectStore } = require('./store')
const { DBRequest } = require('./request')
const { DBTransaction } = require('./transaction')
const { extractify } = require('./extractor')
const { NotFoundError } = require('./error')

const { Future } = require('perhaps')

const Queue = require('avenue')

const Loop = require('./loop')

class DBDatabase {
    constructor (name, schema, transactor, loop, mode) {
        this._schema = schema
        this._transactor = transactor
        this._transaction = null
        this._loop = loop
        this._closing = false
        this._closed = new Future
        this._name = name
        this._mode = mode
        this._transactions = new Set
    }

    get name () {
        return this._name
    }

    get version () {
        throw new Error
    }

    get objectStoreNames () {
        throw new Error
    }

    transaction (names, mode = 'readonly') {
        if (typeof names == 'string') {
            names = [ names ]
        }
        for (const name of names) {
            if (! (name in this._schema.name)) {
                throw new NotFoundError
            }
        }
        const request = new DBRequest
        const loop = new Loop
        const transaction =  new DBTransaction(this._schema, this._database, loop, mode)
        this._transactions.add(transaction)
        this._transactor.transaction({ db: this, transaction, loop }, names, mode == 'readonly')
        return transaction
    }

    createObjectStore (name, { autoIncrement = false, keyPath = null } = {}) {
        // **TODO** Assert we do not have a transaction error.
        if (name === undefined) {
            throw new TypeError
        }
        const id = this._schema.max++
        const schema = this._schema.store[id] = {
            type: 'store',
            id: id,
            name: name,
            qualified: `store.${id}`,
            keyPath: keyPath,
            autoIncrement: autoIncrement ? 0 : null,
            indices: {}
        }
        this._schema.name[name] = id
        const extractor = this._schema.extractor[schema.id] = keyPath != null
            ? extractify(keyPath)
            : null
        this._loop.queue.push({ method: 'store', id, name, autoIncrement, keyPath })
        return new DBObjectStore(this._transaction, name, this, this._loop, this._schema, id)
    }

    deleteObjectStore (name) {
        const id = this._schema.name[name]
        this._schema.store[id].deleted = true
        delete this._schema.name[name]
        this._loop.queue.push({ method: 'destroy', id: id })
    }

    // https://www.w3.org/TR/IndexedDB/#dom-idbdatabase-close
    close () {
        console.log('did close', this._transactions.size)
        this._closing = true
        this._transactor.queue.push({ method: 'close', extra: { db: this } })
    }

    // **TODO** `onabort`, `onclose`, `onerror`, `onversionchange`.
}

exports.DBDatabase = DBDatabase
