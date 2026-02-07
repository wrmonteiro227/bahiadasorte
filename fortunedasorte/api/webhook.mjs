export default async function handler(req, res) {
    // Headers obrigatórios para não dar erro no navegador
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { amount, username, cpf, action } = req.body;

        if (action === 'create_payment') {
            // Chamada direta para a DivPag usando o fetch que já vem na Vercel
            const responsePix = await fetch('https://api.divpag.com.br/v1/pix/generate', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer wrmonteiro_4001873957',
                    'X-Api-Secret': '436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    external_id: String(username),
                    payer_question: `Deposito ${username}`,
                    payer_cpf: cpf ? String(cpf).replace(/\D/g, '') : "00000000000"
                })
            });

            const data = await responsePix.json();
            
            // Retorna o resultado da DivPag direto
            return res.status(200).json(data);
        }

        return res.status(200).json({ status: "ok" });
    } catch (error) {
        // Se der erro, ele manda como JSON, evitando o "Unexpected Token A"
        return res.status(200).json({ error: true, message: error.message });
    }
}
