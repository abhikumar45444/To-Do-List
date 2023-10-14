//jshint esversion:6
// ----------------------------------------------------------------
//! initialization of express app
const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(path.join(__dirname,"date.js"));
require("dotenv").config();

const app = express();

//! setting view engine to EJS
app.set('view engine', 'ejs');
app.set(path.join(__dirname), "views")

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
// ----------------------------------------------------------------


// -----------------------------------------------------------------------------
//! creating connection to todolistDB
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mongodb-demo.k0ejzwo.mongodb.net/todolistDB?retryWrites=true&w=majority`;

//! connecting to todolistDB
mongoose.connect(url)
.then(() => console.log("Connected to DB"))
.catch((err) => console.log(err));
// ----------------------------------------------------------------


// -----------------------------------------------------------------------------
//! Creating items Schema
const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

// -----------------------------------------------------------------------------
//! creating model for items Schema
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name:"Welcome to your Todo List!!"
});

const item2 = new Item({
    name:"Hit + button to add new item."
});

const item3 = new Item({
    name:"<-- Hit this to delete item."
});
// ----------------------------------------------------------------

defaultItems = [item1, item2, item3];

// ----------------------------------------------------------------
//! creating dynamic lists schema which will contain user defined lists
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);
// ----------------------------------------------------------------


// -----------------------------------------------------------------------------
//! home route
app.get("/", function(req, res) {

    const day = date.getDate();

    Item.find(function(err, foundItems){
        if(err){
            console.log(err.message);
        }else{
            if(foundItems.length === 0){
                Item.insertMany(defaultItems, function(err){
                    if(err){
                        console.log(err.message);
                    }
                    else{
                        console.log("items inserted successfully in DB.");
                    }
                });
                
                res.redirect("/");
            }
            else{
                res.render("list", {listTitle: day, newListItems: foundItems});
            }
        }
    });
});

//! post route - add item
app.post("/", function(req, res){

    const item = req.body.newItem;
    const list = _.capitalize(req.body.list);
    
    const day = _.capitalize(date.getDate());

    if(list === day){
        if(item !== ""){
            const createNewItem = new Item({
                name:item
            });
            createNewItem.save();
        }
        res.redirect("/");
    }
    else{
        List.findOne({name:list}, function(err, foundList){
            if(err){
                console.log(err);
            }
            else{
                if(item !== ""){
                    const createNewItem = new Item({
                        name:item
                    });
                    foundList.items.push(createNewItem);
                    foundList.save();
                }
                res.redirect(`/${list}`);
            }
        })
    }
});

//! post route - delete item
app.post("/delete", (req, res) => {
    const deleteItemID = req.body.deleteItem;
    const listName = _.capitalize(req.body.listName);
    
    const day = _.capitalize(date.getDate());

    if(listName === day){
        Item.findByIdAndRemove(deleteItemID, function(err){
            if(err){
                console.log(err.message);
            }
            else{
                console.log(`item is deleted successfully.`);
            }
        });
    
        res.redirect("/");
    }
    else{
        //! using for find and for loop to remove item from array
        // List.findOne({name:listName}, function(err, foundList){
        //         for(let i = 0; i < foundList.items.length; i++){
        //             const itemID = _.truncate(foundList.items[i]._id, {"separator": `"`});
        //             if(itemID === deleteItemID){
        //                 console.log(foundList.items[i]);
        //                 foundList.items.splice(i, 1);
        //                 break;
        //             }
        //         }
        //         foundList.save();
        //         res.redirect(`/${listName}`);
        // });
        
        //! using findone method and calling pull function on items array to delete item.
        // List.findOne({name:listName}, function(err, foundList){
        //     console.log(foundList);
        //     if(err){
        //         console.log(err);
        //     }
        //     else{
        //         console.log("hello");
        //         foundList.items.pull(deleteItemID);
        //         foundList.save();
        //         res.redirect(`/${listName}`);
        //     }
        // });

        List.findOneAndUpdate({name:listName}, {$pull: {items:{_id: deleteItemID}}}, function(err, foundList){
            if(err){
                console.log(err);
            }
            else{
                foundList.save();
                res.redirect(`/${listName}`);
            }
        });
    }
})

//! dynamic list route
app.get("/:listName", (req, res) => {
    const listName = _.capitalize(req.params.listName);
    
    List.findOne({name:listName}, function(err, foundList){
        if(err){
            console.log(err);
        }
        else{
            if(foundList === null){
                // create a new list 
                const newList = new List({
                    name:listName,
                    items:defaultItems
                });

                newList.save();
                res.redirect(`/${listName}`);
            }
            else{
                // show existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
});


app.get("/about", function(req, res){
  res.render("about");
});

//! listening on port
app.listen(port, function() {
  console.log(`Server started on port: ${port}`);
});
