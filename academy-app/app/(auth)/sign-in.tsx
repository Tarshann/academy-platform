import { useSignIn, useAuth } from '@clerk/clerk-expo';
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

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();

  // AuthGuard in _layout.tsx handles all navigation (redirect to tabs when signed in).
  // This screen only manages sign-in submission — no duplicate navigation logic.

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [forgotMode, setForgotMode] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const onSignIn = async () => {
    if (!isLoaded || isSignedIn) return;
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // AuthGuard will navigate to /(tabs) when isSignedIn becomes true
      } else {
        Alert.alert('Error', 'Sign in could not be completed. Please try again.');
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const code = clerkError?.code;
      const message =
        clerkError?.longMessage ||
        clerkError?.message ||
        'Failed to sign in. Please check your credentials.';

      if (code === 'form_identifier_not_found') {
        Alert.alert('Account Not Found', 'No account found with this email. Would you like to create one?');
      } else if (code === 'form_password_incorrect') {
        Alert.alert('Incorrect Password', 'The password you entered is incorrect. Please try again or use "Forgot Password" to reset it.');
      } else if (code === 'user_locked') {
        Alert.alert('Account Locked', 'Your account has been temporarily locked due to too many attempts. Please try again later.');
      } else {
        Alert.alert('Sign In Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!isLoaded) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Email Required', 'Please enter your email address first, then tap "Forgot Password".');
      return;
    }
    setResetLoading(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: trimmedEmail,
      });
      setResetSent(true);
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const code = clerkError?.code;
      const message =
        clerkError?.longMessage ||
        clerkError?.message ||
        'Could not send reset code. Please try again.';

      if (code === 'form_identifier_not_found') {
        Alert.alert('Account Not Found', 'No account found with this email address.');
      } else {
        Alert.alert('Reset Failed', message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!isLoaded) return;
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Password Too Short', 'Password must be at least 8 characters.');
      return;
    }
    setResetLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode.trim(),
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        Alert.alert('Password Reset', 'Your password has been reset and you are now signed in.');
        // AuthGuard will navigate to /(tabs)
      } else {
        Alert.alert('Error', 'Password reset could not be completed. Please try again.');
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const code = clerkError?.code;
      const message =
        clerkError?.longMessage ||
        clerkError?.message ||
        'Failed to reset password.';

      if (code === 'form_code_incorrect') {
        Alert.alert('Invalid Code', 'The verification code is incorrect. Please check and try again.');
      } else if (code === 'form_password_pwned') {
        Alert.alert('Weak Password', 'This password has been found in a data breach. Please choose a different password.');
      } else if (code === 'form_password_length_too_short') {
        Alert.alert('Password Too Short', 'Password must be at least 8 characters.');
      } else {
        Alert.alert('Reset Failed', message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const exitForgotMode = () => {
    setForgotMode(false);
    setResetSent(false);
    setResetCode('');
    setNewPassword('');
  };

  // Forgot password: enter new password + code
  if (forgotMode && resetSent) {
    return (
      <Screen>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the code sent to {email} and your new password.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor={colors.textMuted}
              value={resetCode}
              onChangeText={setResetCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />

            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={colors.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            <Text style={styles.hint}>Must be at least 8 characters</Text>

            <TouchableOpacity
              style={[styles.button, resetLoading && styles.buttonDisabled]}
              onPress={onResetPassword}
              disabled={resetLoading || !resetCode.trim() || !newPassword}
            >
              {resetLoading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={exitForgotMode}>
              <Text style={styles.link}>Back to Sign In</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  // Forgot password: initial email entry
  if (forgotMode) {
    return (
      <Screen>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a code to reset your password.
            </Text>

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

            <TouchableOpacity
              style={[styles.button, resetLoading && styles.buttonDisabled]}
              onPress={onForgotPassword}
              disabled={resetLoading || !email.trim()}
            >
              {resetLoading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={exitForgotMode}>
              <Text style={styles.link}>Back to Sign In</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  // Main sign-in form
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
          <Text style={styles.subtitle}>Sign in to your account</Text>

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
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSignIn}
            disabled={loading || !email.trim() || !password}
          >
            {loading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => setForgotMode(true)}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign Up</Text>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  forgotButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  forgotText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
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
