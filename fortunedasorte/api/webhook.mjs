import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;

export default async function handler(req, res) {
    // Configuração de Headers para evitar erros de bloqueio (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const dados = req.body;

        // Se for a geração de PIX
        if (dados.action === 'create_payment') {
            const API_TOKEN = "wrmonteiro_4001873957"; 
            const API_SECRET = "436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d";

            const respostaDivPag = await fetch('https://api.divpag.com.br/v1/pix/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'X-Api-Secret': API_SECRET,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: dados.amount,
                    external_id: dados.username,
                    payer_question: `Deposito para ${dados.username}`,
                    payer_cpf: dados.cpf.replace(/\D/g, '')
                })
            });

            const resultado = await respostaDivPag.json();

            if (!respostaDivPag.ok) {
                return res.status(400).json({ error: "Erro na DivPag", detalhes: resultado });
            }

            return res.status(200).json(resultado);
        }

        // Se for o Webhook de recebimento (status paid)
        return res.status(200).json({ status: "recebido" });

    } catch (erro) {
        // Isso impede o erro 500 "seco" e te mostra o que houve no console
        return res.status(500).json({ error: "Erro interno no servidor", message: erro.message });
    }
}