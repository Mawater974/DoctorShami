
import React from 'react';
import { DirectoryLayout } from '../components/DirectoryLayout';
import { EntityType } from '../types';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';

export const Pharmacies: React.FC = () => {
    const { lang } = useStore();
    return (
        <DirectoryLayout 
            type={EntityType.PHARMACY} 
            title={TRANSLATIONS.pharmacies[lang]} 
        />
    );
};
