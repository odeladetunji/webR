const express = require('express');
const router = express.Router();

router.get('/', function(request, response){
    response.render('videocall')
});

module.exports = router;
