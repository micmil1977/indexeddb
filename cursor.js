class DBCursor {
    constructor (request, loop, query) {
        this._request = request
        this._loop = loop
        this._query = query
    }

    get source () {
        throw new Error
    }

    get direction () {
        throw new Error
    }

    get key () {
        return this._value.key
    }

    get primaryKey () {
        throw new Error
    }

    advance (count) {
        if (count == 0) {
            throw new TypeError('count must not be zero')
        }
        // TODO If the transaction is not active, throw a
        // 'TransactionInactiveError' `DOMExecption`.
        throw new Error
    }

    continue (key) {
        this._loop.queue.push({ method: 'item', cursor: this, request: this._request })
    }

    continuePrimaryKey (key, primaryKey) {
        throw new Error
    }

    update (value) {
        throw new Error
    }

    delete () {
        throw new Error
    }
}

exports.DBCursor = DBCursor

class DBCursorWithValue extends DBCursor {
    constructor (request, loop, query) {
        super(request, loop, query)
        this._value = null
    }

    get value () {
        return this._value
    }
}

exports.DBCursorWithValue = DBCursorWithValue
