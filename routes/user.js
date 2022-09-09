const express = require('express');
const connection = require('../dbConnection');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');

router.post('/signup', (req, res) => {
    let user = req.body;
    query = "select email,password,role,status from user where email=?"
    connection.query(query, [user.email], (err, result) => {
        if (!err) {
            if (result.length <= 0) {
                query = "insert into user(name,contactNumber,email,password,status,role) values(?,?,?,?,'false','user')"
                connection.query(query, [user.name, user.contactNumber, user.email, user.password], (err, result) => {
                    if (!err) {
                        return res.status(200).json({ messgae: "Successfully Registered" });
                    } else {
                        return res.status(500).json(err);
                    }
                });
            } else {
                return res.status(400).json({ messgae: "Email Already Exist." });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

router.post('/login', (req, res) => {
    let user = req.body;
    query = "select email,password,role,status,name from user where email=?"
    connection.query(query, [user.email], (err, result) => {
        if (!err) {
            if (result.length <= 0 || result[0].password != user.password) {
                return res.status(401).json({ messgae: "InCorrect Username or Password" });
            } else if (result[0].status === 'false') {
                return res.status(401).json({ messgae: "Wait for Admin Approval" });
            } else if (result[0].password == user.password) {
                const response = { email: result[0].email, role: result[0].role, name: result[0].name };
                const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' });
                return res.status(200).json({ token: accessToken });
            } else {
                return res.status(400).json({ messgae: "Something want wrong. Please try again later" });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

var transpoter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
            ssl: true,
            port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

router.post('/forgotPassword', (req, res) => {
    const user = req.body;
    query = "select email,password from user where email=?"
    connection.query(query, [user.email], (err, result) => {
        if (!err) {
            if (result.length <= 0) {
                return res.status(200).json({ messgae: "Pasword send successfully to your email." });
            } else {
                var mailOption = {
                    from: process.env.EMAIL,
                    to: result[0].email,
                    subject: 'Password by Cafe Management System',
                    html: '<p><b>Your Login details for Cafe Management System</b><br><b>Email: </b>' + result[0].email + '<br><b>Password: </b>' + result[0].password + '<br><a href="http://localhost:4200/">Click here ti login</a></p>'
                };
                transpoter.sendMail(mailOption,function(err,info){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Email Send : " + info.response);
                    }
                });
                return res.status(200).json({ messgae: "Pasword send successfully to your email." });
            }
        } else {
            return res.status(500).json(err);
        }
    })
});

router.get('/get',auth.authenticateToken,checkRole.checkRole,(req,res)=>{
    var query = "select id,name,email,contactNumber,status from user where role = 'user'";
    connection.query(query,(err,result)=>{
        if(!err){
            return res.status(200).json(result);
        }else{
            return res.status(500).json(err);
        }
    });
});

router.patch('/update',auth.authenticateToken,(req,res)=>{
    let user = req.body;
    var query = "update user set status=? where id=?";
    connection.query(query,[user.status,user.id],(err,result)=>{
        if(!err){
            if(result.affectedRows == 0){
              return res.status(404).json({messgae:"User id does not exist"});  
            }
            return res.status(200).json({messgae:"User Update Successfully"});
        }else{
            return res.status(500).json(err);
        }
    });
});

router.get('/checkToken',auth.authenticateToken,(req,res)=>{
    return res.status(200).json({messgae:"true"});
});




module.exports = router;