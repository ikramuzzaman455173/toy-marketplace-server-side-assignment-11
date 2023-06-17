const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 4000
const cors = require('cors');

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('<h1 style="color:#333;text-align:center;font-size:20px;margin:10px 0;">Toy Marketplace Server Is Running !!!</h1>')
})

// connect mongodb dataBase


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.izhktyr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const toysRusCollection = client.db("ToysRus").collection("allToys");

    // get all toys data

    app.get('/allToys',async (req, res) => {
      const { sort } = req.query;
      let sortQuery = {};
      if (sort === 'asc') {
        sortQuery = { price: 1 };
      } else if (sort === 'desc') {
        sortQuery = { price: -1 };
      }
      const limit = parseInt(req.query.limit) || 10
      const page = parseInt(req.query.page) || 1
      const skip = (page - 1) * limit

      const result = await toysRusCollection.find({}).sort(sortQuery).limit(limit).skip(skip).toArray();
        res.send(result)
    });

    app.get('/totalToys', async (req, res) => {
      const totalCount = await toysRusCollection.countDocuments({});
      // console.log(`Total Count : ${totalCount}`);
      return res.status(200).send({ count: totalCount })
    })


    // user email query by get allToys
    app.get('/myToys',async (req,res) => {
      let query = {}
      if (req.query?.seller_email) {
        query = { seller_email: req.query.seller_email }
        // console.log(query);
      }
      const result = await toysRusCollection.find(query).toArray()
      // console.log(result);
      res.send(result)
    })


    // get single toy data
    app.get('/toy/:id', async (req, res) => {
      const id = req.params.id
      // console.log(id);
      const query = { _id: new ObjectId(id) }
      const options = {
        projection: { publishdate:0},
      };
      const toyDetails = await toysRusCollection.findOne(query,options);
      res.send(toyDetails)
    })


    // get specfic category data
    app.get('/toysCategory', async (req, res) => {
      try {
        const result = await toysRusCollection.aggregate([
          { $match: { subcategory: { $in: ['Marvel', 'Star Wars', 'Transformers'] } } },
          {
            $group: {
              _id: "$subcategory",
              toys: {
                $push: {
                  _id: '$_id',
                  toysname: "$toysname",
                  toyimg: "$toyimg",
                  price: "$price",
                  rating: "$rating",
                  quantity: "$quantity",
                  description: "$description",
                  publishdate: "$publishdate"
                }
              }
            }
          },
          {
            $project: {
              subcategory: "$_id",
              toys: { $slice: ["$toys", 3] }
            }
          }
        ]).toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    });


    // post or add new toy data
    app.post('/allToys', async (req, res) => {
      const newToy = req.body
      // console.log(newToy);
      const result = await toysRusCollection.insertOne(newToy)
      res.send(result)
    })

    // update toy data
    app.put('/allToys/:id', async (req, res) => {
      const id = req.params.id
      const updateToy = req.body
      // console.log(updateToy,id);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateToyData = {
        $set: {
          seller_name: updateToy.seller_name,
          seller_email: updateToy.seller_email,
          toysname: updateToy.toysname,
          price: updateToy.price,
          rating: updateToy.rating,
          quantity: updateToy.quantity,
          description: updateToy.description
        },
      };
      const result = await toysRusCollection.updateOne(filter, updateToyData, options);
      res.send(result)
    })


    // delete mytoy page toy delete toy by unique id
    app.delete('/allToys/:id',async (req,res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await toysRusCollection.deleteOne(query);
      res.send(result)
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`Toy Marketplace Server Is Running On Port:http://localhost:${port}`);
})
