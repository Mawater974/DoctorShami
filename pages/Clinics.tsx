
import React from 'react';
import { DirectoryLayout } from '../components/DirectoryLayout';
import { EntityType } from '../types';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';

export const Clinics: React.FC = () => {
    const { lang } = useStore();
    return (
        <DirectoryLayout 
            type={EntityType.CLINIC} 
            title={TRANSLATIONS.clinics[lang]} 
        />
    );
};
