const express = require('express');
const router = express.Router();

router.get('/', function(request, response){
    response.render('videocall2')
});

module.exports = router;
