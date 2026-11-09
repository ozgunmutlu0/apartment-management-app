import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/AuthField';
import { GlassCard } from '@/components/GlassCard';
import { IconTile } from '@/components/IconTile';
import { SelectField } from '@/components/SelectField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionLabel } from '@/components/SectionLabel';
import { BrandBlock } from '@/features/auth/components/BrandBlock';
import { useAuth } from '@/lib/auth';
import { authErrorMessage } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

type BuildingLookup = {
  id: string;
  name: string;
  units: { id: string; block: string; number: string; floor: number | null }[];
};

export default function JoinBuildingScreen() {
  const { t } = useTranslation('auth');
  const colors = useColors();
  const { refreshProfile, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [building, setBuilding] = useState<BuildingLookup | null>(null);
  const [unitId, setUnitId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t('errors.required'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_building_by_invite', {
        p_code: trimmed,
      });
      if (rpcError) throw rpcError;
      const found = data as BuildingLookup | null;
      if (!found) {
        setBuilding(null);
        setError(t('errors.invalidCode'));
      } else {
        setBuilding(found);
        setUnitId(found.units[0]?.id ?? '');
      }
    } catch (e) {
      setError(authErrorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (!building || !unitId) return;
    setError(null);
    setBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc('join_building', {
        p_code: code.trim(),
        p_unit_id: unitId,
      });
      if (rpcError) throw rpcError;
      // Reloading the profile flips the root gate to the tabs.
      await refreshProfile();
    } catch (e) {
      setError(authErrorMessage(e, t));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        {...scrollProps}
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <BrandBlock title={t('join.title')} subtitle={t('join.subtitle')} />

        <GlassCard style={styles.form}>
          <AuthField
            value={code}
            onChangeText={(value) => {
              setCode(value);
              if (building) setBuilding(null);
            }}
            placeholder={t('join.code')}
            accessibilityLabel={t('join.code')}
            style={styles.code}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="search"
            onSubmitEditing={lookup}
          />

          {error ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
              {error}
            </Text>
          ) : null}

          {building ? (
            <PrimaryButton
              title={t('join.submit')}
              loading={busy}
              disabled={!unitId}
              onPress={join}
            />
          ) : (
            <PrimaryButton title={t('join.lookup')} loading={busy} onPress={lookup} />
          )}
        </GlassCard>

        {building ? (
          <View>
            <SectionLabel>{t('join.building')}</SectionLabel>
            <GlassCard style={styles.preview}>
              <View style={styles.previewHead}>
                <IconTile symbol={{ ios: 'building.2.fill', android: 'apartment' }} />
                <Text style={[styles.buildingName, { color: colors.label }]}>{building.name}</Text>
              </View>
              <Text style={[styles.rowLabel, { color: colors.secondaryLabel }]}>
                {t('join.unit')}
              </Text>
              <SelectField
                value={unitId}
                onChange={setUnitId}
                options={building.units.map((unit) => ({
                  value: unit.id,
                  label: t('join.unitLabel', { block: unit.block, number: unit.number }),
                }))}
              />
            </GlassCard>
          </View>
        ) : null}

        <PrimaryButton variant="plain" title={t('join.signOut')} onPress={() => void signOut()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.xl, gap: space.xl },
  form: { gap: space.md },
  code: { ...type.title, minHeight: 64, textAlign: 'center', letterSpacing: 4 },
  preview: { gap: space.md },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowLabel: { ...type.small },
  buildingName: { ...type.headline, flexShrink: 1 },
  error: { ...type.small },
});
