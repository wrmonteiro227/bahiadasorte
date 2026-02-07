export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { amount, username, cpf } = req.body;

    try {
        const response = await fetch('https://api.divpag.com.br/v1/pix/generate', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer wrmonteiro_4001873957',
                'X-Api-Secret': '436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                external_id: username,
                payer_question: `Dep. ${username}`,
                payer_cpf: cpf ? cpf.replace(/\D/g, '') : "00000000000"
            })
        });
        const data = await response.json();
        return res.status(200).json(data); // Devolve o PIX direto sem salvar no banco
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
