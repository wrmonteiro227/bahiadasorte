import axios from 'axios';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { amount, username, cpf, action } = req.body;

        if (action === 'create_payment') {
            // Seus dados da DivPag (conforme a nova documentação)
            const CLIENT_ID = "wrmonteiro_4001873957"; 
            const CLIENT_SECRET = "436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d";

            // Nova URL da documentação v3
            const urlDivPag = 'https://divpag.com/v3/pix/qrcode';

            // Criando o formulário conforme o exemplo PHP da DivPag
            const params = new URLSearchParams();
            params.append('client_id', CLIENT_ID);
            params.append('client_secret', CLIENT_SECRET);
            params.append('nome', username); // Nome do pagador
            params.append('cpf', cpf ? String(cpf).replace(/\D/g, '') : "00000000000");
            params.append('valor', parseFloat(amount));
            params.append('descricao', `Deposito para ${username}`);
            params.append('urlnoty', 'https://bahiadasorte.vercel.app/api/webhook'); // Sua URL de retorno

            const responsePix = await axios.post(urlDivPag, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 15000
            });

            // A DivPag retorna 'qrcode' e 'transactionId'
            return res.status(200).json(responsePix.data);
        }

        return res.status(200).json({ status: "ok" });
    } catch (error) {
        const detalhes = error.response ? JSON.stringify(error.response.data) : error.message;
        return res.status(200).json({ error: true, message: "Erro DivPag: " + detalhes });
    }
}
