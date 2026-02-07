export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { amount, username, cpf, action } = req.body;

        if (action === 'create_payment') {
            // Usamos uma URL direta com tratamento de erro de rede
            const responsePix = await fetch('https://api.divpag.com.br/v1/pix/generate', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer wrmonteiro_4001873957',
                    'X-Api-Secret': '436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' // Força a API a saber que queremos JSON
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    external_id: String(username),
                    payer_question: `Deposito ${username}`,
                    payer_cpf: cpf ? String(cpf).replace(/\D/g, '') : "00000000000"
                })
            }).catch(err => {
                // Captura o erro de rede ANTES de tentar ler o JSON
                throw new Error("Erro de conexão com DivPag: " + err.message);
            });

            if (!responsePix.ok) {
                const errorText = await responsePix.text();
                return res.status(200).json({ error: true, message: "DivPag recusou: " + errorText });
            }

            const data = await responsePix.json();
            return res.status(200).json(data);
        }

        return res.status(200).json({ status: "ok" });
    } catch (error) {
        // Se o fetch falhar, ele vai dizer exatamente PORQUE (timeout, dns, etc)
        return res.status(200).json({ error: true, message: error.message });
    }
}
