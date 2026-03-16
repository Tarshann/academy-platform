import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { colors } from '../../lib/theme';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();

  // AuthGuard in _layout.tsx handles navigation when isSignedIn changes.

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const onSignUp = async () => {
    if (!isLoaded || isSignedIn) return;
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const errCode = clerkError?.code;
      const message =
        clerkError?.longMessage ||
        clerkError?.message ||
        'Failed to sign up. Please try again.';

      if (errCode === 'form_identifier_exists') {
        Alert.alert(
          'Account Already Exists',
          'An account with this email already exists. Please sign in instead.',
          [
            { text: 'Go to Sign In', onPress: () => setPendingVerification(false) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else if (errCode === 'form_password_pwned') {
        Alert.alert('Weak Password', 'This password has been found in a data breach. Please choose a different password.');
      } else if (errCode === 'form_password_length_too_short') {
        Alert.alert('Password Too Short', 'Password must be at least 8 characters.');
      } else if (errCode === 'form_param_format_invalid') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else {
        Alert.alert('Sign Up Failed', message);
      }

      // If signUp.create succeeded but prepareEmailAddressVerification failed,
      // the signUp object still has the attempt. Don't set pendingVerification
      // since no code was sent — the catch block already handles the error.
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    if (!isLoaded || resending) return;
    setResending(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code Sent', `A new verification code was sent to ${email}`);
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code;

      // Use Clerk error codes instead of fragile string matching
      if (
        errCode === 'verification_expired' ||
        errCode === 'client_state_invalid' ||
        errCode === 'sign_up_attempt_expired'
      ) {
        Alert.alert(
          'Session Expired',
          'Your sign-up session has expired. Your account may already be created — try signing in.',
          [
            { text: 'Go to Sign In', onPress: () => setPendingVerification(false) },
            { text: 'Try Again', style: 'cancel', onPress: () => setPendingVerification(false) },
          ]
        );
      } else {
        // Generic fallback for unknown errors — still offer recovery path
        Alert.alert(
          'Could Not Resend',
          'Something went wrong. Your account may already be created — try signing in.',
          [
            { text: 'Go to Sign In', onPress: () => setPendingVerification(false) },
            { text: 'Try Again', style: 'cancel' },
          ]
        );
      }
    } finally {
      setResending(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // AuthGuard will navigate to /(tabs) when isSignedIn becomes true
      } else {
        Alert.alert('Error', 'Verification could not be completed. Please try again.');
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const errCode = clerkError?.code;
      const message =
        clerkError?.longMessage ||
        clerkError?.message ||
        '';

      // Use Clerk error codes for reliable detection instead of string matching
      if (
        errCode === 'verification_expired' ||
        errCode === 'client_state_invalid' ||
        errCode === 'sign_up_attempt_expired'
      ) {
        Alert.alert(
          'Account Created',
          'Your account was created but the verification session expired. Please sign in to continue.',
          [
            { text: 'Go to Sign In', onPress: () => setPendingVerification(false) },
          ]
        );
      } else if (errCode === 'form_code_incorrect') {
        Alert.alert('Invalid Code', 'The verification code is incorrect. Please check and try again.');
      } else {
        Alert.alert('Verification Failed', message || 'Invalid verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <Screen>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              Enter the verification code sent to {email}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onVerify}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={onResendCode}
              disabled={resending}
            >
              <Text style={styles.resendText}>
                {resending ? 'Sending...' : "Didn't get a code? Resend"}
              </Text>
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Already verified? </Text>
              <TouchableOpacity onPress={() => setPendingVerification(false)}>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Image
            source={require('../../assets/academy-logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Create your account</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Text style={styles.hint}>Must be at least 8 characters</Text>

          <TouchableOpacity
            style={[styles.button, (loading || !email.trim() || password.length < 8) && styles.buttonDisabled]}
            onPress={onSignUp}
            disabled={loading || !email.trim() || password.length < 8}
          >
            {loading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logo: {
    width: 160,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  resendText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
