import React from 'react';
import { Icon } from './Icon';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceOpen?: boolean;
  userProfile: any | null;
}

const INITIATE_URL = 'https://us-central1-engenharia-de-cortes-5d.cloudfunctions.net/api/createSubscription'; 

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, forceOpen = false, userProfile }) => {
  if (!isOpen) return null;

  const iniciarAssinatura = async (planType: 'monthly' | 'yearly') => {
    if (!userProfile || !userProfile.uid || !userProfile.email) {
        alert('Os dados do seu perfil estão incompletos ou não puderam ser carregados. A assinatura não pode ser iniciada. Por favor, faça login novamente.');
        return;
    }

    const dadosDoPlano = {
        userId: userProfile.uid,
        userEmail: userProfile.email,
        planType: planType,
    };

    try {
        const resposta = await fetch(INITIATE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosDoPlano),
        });

        if (!resposta.ok) {
            const errorData = await resposta.json();
            throw new Error(errorData.error || 'Falha ao comunicar com o servidor.');
        }

        const resultado = await resposta.json();

        if (resultado.checkoutUrl) { 
            window.location.href = resultado.checkoutUrl;
        } else {
            alert('Falha ao gerar o link de pagamento.');
        }

    } catch (erro) {
        console.error('Erro ao conectar com o Back-End:', erro);
        alert(`Erro ao iniciar assinatura: ${(erro as Error).message}`);
    }
  };


  const premiumFeatures = [
    "Análises de corte e cor ilimitadas",
    "Salvar até 100 planos de corte",
    "Visualização 3D interativa avançada",
    "Exportação de PDF em alta resolução",
    "Acesso a novos modelos de IA antecipadamente",
    "Suporte prioritário por e-mail"
  ];
  
  const testimonials = [
      {
          quote: "Essa ferramenta revolucionou meu salão. O planejamento dos cortes ficou muito mais preciso e meus clientes amam ver a simulação do resultado!",
          name: "Juliana Alves",
          title: "Hairstylist em São Paulo, SP"
      },
      {
          quote: "Nunca mais errei um tom de 'morena iluminada'. A análise de colorimetria é incrivelmente precisa. Recomendo para todos os coloristas.",
          name: "Ricardo Mendes",
          title: "Colorista Expert em Belo Horizonte, MG"
      }
  ];

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={forceOpen ? undefined : onClose}>
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-4xl flex flex-col shadow-2xl shadow-emerald-500/10 max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-between items-start pb-4 mb-4 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400">
              Engenharia de Cortes 5D Premium
            </h2>
            <p className="text-gray-400 mt-1">Desbloqueie todo o potencial da IA.</p>
          </div>
          {!forceOpen && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
                <Icon name="close" className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2">
            {forceOpen && (
              <div className="text-center mb-6 bg-red-900/30 p-4 rounded-lg border border-red-500/50">
                  <h3 className="text-xl font-bold text-red-300">Seu período de teste gratuito terminou!</h3>
                  <p className="text-red-200 mt-1">Por favor, escolha um plano para continuar usando o app.</p>
              </div>
            )}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Plans */}
                 <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Monthly Plan */}
                    <div className="bg-gray-700/50 p-6 rounded-lg border-2 border-gray-600 flex flex-col">
                        <h3 className="text-xl font-semibold text-white">Plano Mensal</h3>
                        <div className="flex-grow my-4">
                            <p className="mb-4">
                                <span className="text-4xl font-bold text-white">R$ 249</span>
                                <span className="text-gray-400">/mês</span>
                            </p>
                            <p className="text-gray-400 text-sm">Acesso completo com cobrança recorrente mensal.</p>
                        </div>
                        <button 
                            onClick={() => iniciarAssinatura('monthly')}
                            className="w-full bg-gray-600 text-white rounded-lg font-bold text-center py-3 hover:bg-emerald-600 transition-colors"
                        >
                            Assinar Agora
                        </button>
                    </div>
                     {/* Yearly Plan */}
                    <div className="bg-gray-700/50 p-6 rounded-lg border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 flex flex-col relative">
                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">MAIS POPULAR</div>
                        <h3 className="text-xl font-semibold text-white">Plano Anual</h3>
                        <div className="flex-grow my-4">
                            <p className="mb-1">
                                <span className="text-4xl font-bold text-white">R$ 199</span>
                                <span className="text-gray-400">/mês</span>
                            </p>
                             <p className="text-gray-400 text-sm">Cobrado R$ 2.388 por ano. <br/> <span className="font-bold text-emerald-300">Economize R$ 600!</span></p>
                        </div>
                        <button 
                            onClick={() => iniciarAssinatura('yearly')}
                            className="w-full bg-emerald-600 text-white rounded-lg font-bold text-center py-3 hover:bg-emerald-500 transition-colors"
                        >
                            Assinar Plano Anual
                        </button>
                    </div>
                </div>

                {/* Right Column: Features */}
                <div className="w-full lg:w-1/3 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Todos os planos incluem:</h3>
                    <ul className="space-y-3">
                        {premiumFeatures.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="bg-emerald-600/20 p-1 rounded-full mt-1 flex-shrink-0">
                                    <Icon name="check" className="w-4 h-4 text-emerald-300" />
                                </div>
                                <span className="text-gray-200 text-sm">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {/* Testimonials */}
            <div className="mt-10 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-semibold text-center text-white mb-6">O que os profissionais estão dizendo</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="bg-gray-900/50 p-6 rounded-lg">
                            <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                            <p className="text-right mt-4 font-semibold text-emerald-300">— {testimonial.name}</p>
                             <p className="text-right text-sm text-gray-500">{testimonial.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        <p className="flex-shrink-0 text-xs text-center text-gray-500 mt-8 pt-4 border-t border-gray-700">
            * Você será redirecionado para um ambiente de pagamento seguro. O checkout é real.
        </p>
      </div>
    </div>
  );
};