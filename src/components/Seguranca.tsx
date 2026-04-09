/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

export const usePerfilProtegido = () => {
  const [perfil, setPerfil] = useState('kids'); // 'kids' ou 'adulto'
  const [mostrarPin, setMostrarPin] = useState(false);

  const trocarParaAdulto = () => {
    if (perfil === 'adulto') return;
    setMostrarPin(true);
  };

  const trocarParaKids = () => {
    setPerfil('kids');
  };

  const confirmarPin = (pin: string) => {
    if (pin === "1234") { // Senha padrão simples
      setPerfil('adulto');
      setMostrarPin(false);
      return true;
    } else {
      return false;
    }
  };

  return { 
    perfil, 
    setPerfil, 
    trocarParaAdulto, 
    trocarParaKids,
    mostrarPin, 
    setMostrarPin, 
    confirmarPin 
  };
};
