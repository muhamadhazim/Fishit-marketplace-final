const mongoose = require('mongoose');
const readline = require('readline');

const uri = 'mongodb://127.0.0.1:27017/fishit_marketplace';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function run() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nAvailable Collections:');
        collections.forEach((c, i) => console.log(`${i + 1}. ${c.name}`));

        rl.question('\nEnter the number of the collection to manage (or 0 to exit): ', async (answer) => {
            const index = parseInt(answer) - 1;
            if (index >= 0 && index < collections.length) {
                const colName = collections[index].name;
                const model = mongoose.connection.db.collection(colName);

                const count = await model.countDocuments();
                console.log(`\nCollection '${colName}' has ${count} documents.`);

                rl.question(`Type 'DELETE' to delete ALL documents in '${colName}', or anything else to cancel: `, async (confirm) => {
                    if (confirm === 'DELETE') {
                        await model.deleteMany({});
                        console.log(`All documents in '${colName}' have been deleted.`);
                    } else {
                        console.log('Operation cancelled.');
                    }
                    close();
                });
            } else {
                close();
            }
        });

    } catch (err) {
        console.error(err);
        close();
    }
}

function close() {
    mongoose.disconnect();
    rl.close();
    process.exit(0);
}

run();
