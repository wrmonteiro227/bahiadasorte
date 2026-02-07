import axios from 'axios';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { amount, username, cpf, action } = req.body;

        if (action === 'create_payment') {
            const API_TOKEN = "wrmonteiro_4001873957"; 
            const API_SECRET = "436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d";

            // Criamos a URL garantindo que não existam caracteres invisíveis
            const urlFinal = 'https://api.divpag.com.br/v1/pix/generate'.trim();

            const responsePix = await axios({
                method: 'post',
                url: urlFinal,
                data: {
                    amount: parseFloat(amount),
                    external_id: String(username),
                    payer_question: `Deposito ${username}`,
                    payer_cpf: cpf ? String(cpf).replace(/\D/g, '') : "00000000000"
                },
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'X-Api-Secret': API_SECRET,
                    'Content-Type': 'application/json',
                    'User-Agent': 'VercelServerlessFunction' // Ajuda a API a identificar o servidor
                },
                timeout: 15000 // Aumentamos para 15 segundos
            });

            return res.status(200).json(responsePix.data);
        }

        return res.status(200).json({ status: "ok" });
    } catch (error) {
        // Se der ENOTFOUND, tentamos dar uma dica do que fazer
        let msg = error.message;
        if (msg.includes('ENOTFOUND')) {
            msg = "O servidor não encontrou a DivPag. Verifique se a URL está correta ou se o serviço deles caiu.";
        }
        const detalhes = error.response ? JSON.stringify(error.response.data) : msg;
        return res.status(200).json({ error: true, message: "Erro de Conexão: " + detalhes });
    }
}
