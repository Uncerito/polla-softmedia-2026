import React, { useState, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const getFlagUrl = (countryName) => {
  const mapping = {
    'México': 'mx',
    'Sudáfrica': 'za',
    'Corea del Sur': 'kr',
    'República de Corea': 'kr',
    'República Checa': 'cz',
    'Chequia': 'cz',
    'Canadá': 'ca',
    'Bosnia y Herzegovina': 'ba',
    'Estados Unidos': 'us',
    'Paraguay': 'py',
    'Catar': 'qa',
    'Suiza': 'ch',
    'Brasil': 'br',
    'Marruecos': 'ma',
    'Haití': 'ht',
    'Escocia': 'gb-sct',
    'Australia': 'au',
    'Turquía': 'tr',
    'Alemania': 'de',
    'Curazao': 'cw',
    'Curaçao': 'cw',
    'Países Bajos': 'nl',
    'Japón': 'jp',
    'Costa de Marfil': 'ci',
    'Ecuador': 'ec',
    'Suecia': 'se',
    'Túnez': 'tn',
    'España': 'es',
    'Cabo Verde': 'cv',
    'Bélgica': 'be',
    'Egipto': 'eg',
    'Arabia Saudita': 'sa',
    'Arabia Saudí': 'sa',
    'Uruguay': 'uy',
    'Irán': 'ir',
    'Nueva Zelanda': 'nz',
    'Francia': 'fr',
    'Senegal': 'sn',
    'Irak': 'iq',
    'Noruega': 'no',
    'Argentina': 'ar',
    'Argelia': 'dz',
    'Austria': 'at',
    'Jordania': 'jo',
    'Costa Rica': 'cr',
    'Camerún': 'cm',
    'Inglaterra': 'gb',
    'Italia': 'it',
    'Portugal': 'pt',
    'Colombia': 'co',
    'RD Congo': 'cd',
    'Uzbekistán': 'uz',
    'Croacia': 'hr',
    'Ghana': 'gh',
    'Panamá': 'pa',
    'EE. UU.': 'us',
    'RI de Irán': 'ir',
    'Islas de Cabo Verde': 'cv'
  };
  const code = mapping[countryName];
  return code ? `https://flagcdn.com/w80/${code}.png` : `https://placehold.co/80x50/1f2937/ffffff?text=${(countryName || '').substring(0, 3).toUpperCase()}`;
};

export const isPlaceholderTeam = (teamName) => {
  if (!teamName) return true;
  const lower = teamName.toLowerCase();
  return (
    lower.includes('grupo') ||
    lower.includes('º') ||
    lower.includes('ganador') ||
    lower.includes('perdedor') ||
    /m\d+/.test(lower)
  );
};

export function CollaboratorAvatar({ userId, nombre, apellido, className }) {
  const getCollaboratorFilename = (nom, ape) => {
    if (!nom) return '';
    const clean = (str) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    };
    const normNombre = clean(nom);
    const normApellido = clean(ape || '');
    const combined = normNombre + normApellido;

    const exceptions = {
      'marcorumaldo': 'marcoromaldo',
      'martingonzales': 'martringonzales',
      'paulmalqui': 'paulmallqui',
      'kojiropacha': 'kojiropachas',
      'melizamendoza': 'melizamensoza',
      'melisamendoza': 'melizamensoza',
    };

    return exceptions[combined] || combined;
  };

  const filename = getCollaboratorFilename(nombre, apellido);
  const [imgSrc, setImgSrc] = useState(filename ? `./images/colaboradores/${filename}.png` : '');
  const [retryJpg, setRetryJpg] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!filename) {
      setHasError(true);
    } else {
      setImgSrc(`./images/colaboradores/${filename}.png`);
      setRetryJpg(false);
      setHasError(false);
    }
  }, [filename]);

  const handleError = () => {
    if (!retryJpg && filename) {
      setRetryJpg(true);
      setImgSrc(`./images/colaboradores/${filename}.jpg`);
    } else {
      setHasError(true);
    }
  };

  const initials = `${nombre ? nombre[0] : ''}${apellido ? apellido[0] : ''}`.toUpperCase();

  if (hasError || !userId) {
    return html`
      <div class="rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 flex-shrink-0 ${className}">
        ${initials}
      </div>
    `;
  }

  return html`
    <img 
      src=${imgSrc} 
      onError=${handleError} 
      class="rounded-full object-cover border border-slate-200 flex-shrink-0 ${className}" 
      alt=${`${nombre} ${apellido}`} 
    />
  `;
}


