const { Queue } = require('avenue')

// Appears to be the logic for blocking requests so that overlapping writers
// wait on each other.
class Transactor {
    constructor () {
        this.queue = new Queue
        this._queues = []
    }

    _startTransactions () {
        WAITS: for (const name in this._queues) {
            // Necessary to pass web platform tests. Some Web Platform Tests
            // monkey patch Object in order to assert that clone and injection
            // assignments are done through property definitions, not setters.
            if (! this._queues.hasOwnProperty(name)) {
                continue
            }
            const queue = this._queues[name]
            for (;;) {
                const node = queue.waiting[0]
                if (node == null) {
                    continue WAITS
                }
                let iterator = node.wait.head
                const wait = iterator.wait
                while (iterator != null) {
                    const queue = this._queues[iterator.name]
                    if (
                        queue.waiting[0] !== iterator ||
                        (
                            queue.running != null &&
                            ! (queue.running.readOnly && wait.readOnly)
                        )
                    ) {
                        continue WAITS
                    }
                    iterator = iterator.next
                }
                iterator = node.wait.head
                while (iterator != null) {
                    const queue = this._queues[iterator.name]
                    queue.waiting.shift()
                    if (queue.running == null) {
                        queue.running = { count: 1, readOnly: wait.readOnly }
                    } else {
                        queue.running.count++
                    }
                    iterator = iterator.next
                }
                const { names, readOnly, extra } = wait
                this.queue.push({ method: 'transact', names, readOnly, extra })
            }
        }
    }

    transaction (extra, names, readOnly) {
        const wait = { head: null, readOnly, count: 1, names, extra }
        for (const nameOrg of names) {
            const name = `QUEUE__${nameOrg}`;
            const node = { wait, name, next: wait.head }
            wait.head = node
            this._queues[name] || (this._queues[name] = { waiting: [], running: null })
            this._queues[name].waiting.push(node)
        }
        this._startTransactions()
    }

    complete (names) {
        for (const nameOrg of names) {
            const name = `QUEUE__${nameOrg}`;
            const queue = this._queues[name]
            queue.running.count--
            if (queue.running.count == 0) {
                queue.running = null
                if (queue.waiting.length == 0) {
                    delete this._queues[name]
                }
            }
        }
        this._startTransactions()
    }
}

module.exports = Transactor
