require('dotenv').config()
const app = require('./src/app')

port=process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})