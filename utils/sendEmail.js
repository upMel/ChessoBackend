const nodemailer = require('nodemailer')


const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: "465",
        secure: true,
        auth: {
            type: "OAuth2",    // defining the authentication type
            clientId: process.env.GOOGLE_CLIENT_ID,    
            clientSecret:  process.env.GOOGLE_CLIENT_SECRET,
        },
        tls:{rejectUnauthorized:false}
    })

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
        attachments: [
            {
                filename: 'chesso.png',
                path: __dirname + '/chesso.png',
                cid: 'chesso.png'
            }
        ],
        auth: {
            user: "meletis1997@gmail.com",   // replace this with your google email
            refreshToken: "1//04a2BeONPI-E6CgYIARAAGAQSNwF-L9IrZAqZ7qLOJZRN7DpqQLZ_fieIQsBjzyp4PnTlOygaq_8q_j1vIQ4XlF1z-3tTTnToKnc",    // this will be obtained in part 2 
            accessToken: "ya29.a0ARrdaM98u-WNK1ptWIeIh66i7DpaE5xKMloxBrLanGocBvye-7u9yF75WtV03SMgOaeOK9Qh0tmCXruGQoSE0lxPdn7RowzrOBHzRsyxMOILFI3KyB07lDZlIlfRg_2tC0xV1CZAS_V8i0OKhIKtSbTx1m1X",    // this will be obtained in part 2 
            expires: new Date().getTime(),  // this will request a new token each time so that it never expires. google allows up to 10,000 requests per day for free.
          },
    }

    const info = await transporter.sendMail(message)
    console.log('Message sent : %s', info.messageId)
    console.log(__dirname)
}

module.exports = sendEmail