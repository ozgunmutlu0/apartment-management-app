import { Picker } from '@expo/ui/community/picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthField } from '@/components/AuthField';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { authErrorMessage } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/theme/colors';

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
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.label }]}>{t('join.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
            {t('join.subtitle')}
          </Text>
        </View>

        <GlassCard style={styles.form}>
          <AuthField
            value={code}
            onChangeText={(value) => {
              setCode(value);
              if (building) setBuilding(null);
            }}
            placeholder={t('join.code')}
            accessibilityLabel={t('join.code')}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="search"
            onSubmitEditing={lookup}
          />

          {building ? (
            <>
              <View style={styles.row}>
                <Text style={{ color: colors.secondaryLabel }}>{t('join.building')}</Text>
                <Text style={[styles.buildingName, { color: colors.label }]}>{building.name}</Text>
              </View>
              <Text style={{ color: colors.secondaryLabel }}>{t('join.unit')}</Text>
              <Picker selectedValue={unitId} onValueChange={(value) => setUnitId(String(value))}>
                {building.units.map((unit) => (
                  <Picker.Item
                    key={unit.id}
                    value={unit.id}
                    label={t('join.unitLabel', { block: unit.block, number: unit.number })}
                  />
                ))}
              </Picker>
            </>
          ) : null}

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

        <PrimaryButton variant="plain" title={t('join.signOut')} onPress={() => void signOut()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 20 },
  header: { gap: 6 },
  title: { fontSize: 30, fontWeight: '600', letterSpacing: -0.7, textAlign: 'left' },
  subtitle: { fontSize: 16 },
  form: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buildingName: { fontSize: 17, fontWeight: '600' },
  error: { fontSize: 14 },
});
