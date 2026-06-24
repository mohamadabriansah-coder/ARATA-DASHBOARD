import axios from 'axios';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [weldersData, setWeldersData] = useState<any[]>([]);
  const [selectedWelder, setSelectedWelder] = useState<any>(null); 
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  // ==========================================
  // FITUR 1: FIREBASE AUTH (LOGIN PIMPINAN)
  // ==========================================
  const handleRegister = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => Alert.alert("Registrasi Sukses", "Akun Pimpinan berhasil didaftarkan."))
      .catch((error: any) => Alert.alert("Autentikasi Gagal", error.message));
  };

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => setIsLoggedIn(true))
      .catch(() => Alert.alert("Autentikasi Gagal", "Kredensial tidak valid."));
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setIsLoggedIn(false);
      setWeldersData([]);
      setSelectedWelder(null);
      setEmail('');
      setPassword('');
    });
  };

  // ==========================================
  // FITUR 2: AXIOS (MENARIK DATA KINERJA)
  // ==========================================
  const fetchWeldersData = async () => {
    setIsLoadingApi(true);
    try {
      const response = await axios.get('https://jsonplaceholder.typicode.com/users');
      
      const maleNames = [
        "Ahmad Hidayat", "Budi Santoso", "Candra Wijaya", "Deni Pratama", 
        "Eko Susanto", "Fajar Nugroho", "Gilang Ramadhan", "Hendra Setiawan",
        "Irwan Maulana", "Joko Wibowo"
      ];

      let mappedData = response.data.map((user: any, index: number) => {
        const baseEffectiveness = 75 + (user.name.length * 2) - index; 
        const isAnomaly = index % 4 === 0; 
        const calculatedKualitas = 80 + index + (user.name.length);
        const finalKualitas = calculatedKualitas > 100 ? 100 : calculatedKualitas;
        
        // Logika Jam Kerja Tahunan (Maksimal 576)
        const calculatedJam = 400 + (index * 15);
        const finalJam = calculatedJam > 576 ? 576 : calculatedJam;

        return {
          id: user.id,
          nama: maleNames[index] || user.name,
          efektivitas: baseEffectiveness > 100 ? 98 : baseEffectiveness,
          jamKerjaTahunan: finalJam,
          kualitasLas: finalKualitas,
          anomali: isAnomaly ? 2 : 0,
          status: isAnomaly ? 'PERLU EVALUASI' : 'OPTIMAL'
        };
      });

      mappedData.sort((a: any, b: any) => b.efektivitas - a.efektivitas);
      mappedData = mappedData.map((data: any, index: number) => ({
        ...data, peringkat: index + 1
      }));

      setWeldersData(mappedData);
    } catch (error: any) {
      Alert.alert("Koneksi Gagal", "Tidak dapat menarik data dari server pusat.");
    } finally {
      setIsLoadingApi(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchWeldersData();
    }
  }, [isLoggedIn]);

  // ==========================================
  // FITUR 3: FIRESTORE (SIMPAN KE DATABASE)
  // ==========================================
  const simpanLaporanKinerja = async () => {
    if (weldersData.length === 0) {
      Alert.alert("Data Kosong", "Silakan lakukan SINKRONISASI DATA terlebih dahulu.");
      return;
    }
    
    setIsSavingDb(true);
    try {
      const daftarPeringkat = weldersData.map((w) => ({
        peringkat: w.peringkat, nama: w.nama, efektivitas: w.efektivitas,
        jamKerjaTahunan: w.jamKerjaTahunan, kualitasLas: w.kualitasLas, eksiden: w.anomali, status: w.status
      }));

      await addDoc(collection(db, "laporan_kinerja_tahunan"), {
        dicetak_oleh: auth.currentUser?.email,
        total_pekerja: weldersData.length,
        daftar_peringkat: daftarPeringkat,
        waktu_cetak: serverTimestamp()
      });
      
      Alert.alert("Arsip Berhasil", "Laporan rekapitulasi tahunan telah tersimpan di database.");
    } catch (error: any) {
      Alert.alert("Gagal Menyimpan", error.message);
    } finally {
      setIsSavingDb(false);
    }
  };

  // ==========================================
  // RENDER UI: DETAIL PEKERJA
  // ==========================================
  if (isLoggedIn && selectedWelder) {
    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detail Pekerja</Text>
          <Text style={styles.headerSubtitle}>ID: WLD-{selectedWelder.id.toString().padStart(4, '0')}</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailName}>{selectedWelder.nama}</Text>
            <View style={[styles.statusBadge, selectedWelder.status === 'OPTIMAL' ? styles.badgeSuccess : styles.badgeWarning]}>
              <Text style={styles.statusText}>{selectedWelder.status}</Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>PERINGKAT</Text>
              <Text style={styles.gridValue}>#{selectedWelder.peringkat}</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>EFEKTIVITAS</Text>
              <Text style={[styles.gridValue, { color: '#0056b3' }]}>{selectedWelder.efektivitas}%</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>TOTAL JAM KERJA (TAHUNAN)</Text>
              <Text style={styles.gridValue}>{selectedWelder.jamKerjaTahunan} Jam</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>KUALITAS LAS (QC)</Text>
              <Text style={styles.gridValue}>{selectedWelder.kualitasLas}%</Text>
            </View>
          </View>

          <View style={styles.alertBox}>
            <Text style={styles.alertLabel}>ANOMALI KEAMANAN TERDETEKSI</Text>
            <Text style={styles.alertValue}>{selectedWelder.anomali} Eksiden</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.buttonOutline} onPress={() => setSelectedWelder(null)}>
          <Text style={styles.buttonTextDark}>KEMBALI KE PAPAN PERINGKAT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // RENDER UI: DASHBOARD (PAPAN PERINGKAT)
  // ==========================================
  if (isLoggedIn && !selectedWelder) {
    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ARATA Executive Dashboard</Text>
          <Text style={styles.headerSubtitle}>Laporan Kinerja Tahunan</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.buttonAction} onPress={fetchWeldersData}>
            <Text style={styles.buttonTextSmall}>SINKRONISASI DATA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonActionDark} onPress={simpanLaporanKinerja} disabled={isSavingDb}>
            {isSavingDb ? <ActivityIndicator color="#fff" size="small"/> : <Text style={styles.buttonTextSmallLight}>ARSIP KE DATABASE</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Papan Peringkat Kinerja</Text>

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {isLoadingApi ? (
            <ActivityIndicator size="large" color="#1A365D" style={{ marginTop: 50 }} />
          ) : (
            weldersData.map((welder) => (
              <View key={welder.id} style={styles.rankCard}>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>{welder.peringkat}</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.welderName}>{welder.nama}</Text>
                  <Text style={styles.dataText}>Efektivitas: {welder.efektivitas}%</Text>
                </View>
                <TouchableOpacity style={styles.buttonDetail} onPress={() => setSelectedWelder(welder)}>
                  <Text style={styles.buttonDetailText}>DETAIL</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
          <Text style={styles.buttonTextDanger}>AKHIRI SESI</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // RENDER UI: LOGIN PIMPINAN
  // ==========================================
  return (
    <View style={styles.loginContainer}>
      <Text style={styles.title}>ARATA PORTAL</Text>
      <Text style={styles.subtitle}>Sistem Manajemen & Analitik Pekerja</Text>

      <View style={styles.loginBox}>
        <Text style={styles.inputLabel}>IDENTITAS KREDENSIAL</Text>
        <TextInput
          style={styles.input}
          placeholder="Email Korporat"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Kata Sandi"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin}>
          <Text style={styles.buttonText}>MASUK</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSecondary} onPress={handleRegister}>
          <Text style={styles.buttonTextDark}>DAFTARKAN AKSES BARU</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==========================================
// STYLING APLIKASI
// ==========================================
const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#1A365D', alignItems: 'center', justifyContent: 'center', padding: 20 },
  loginBox: { width: '100%', backgroundColor: '#fff', padding: 25, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  dashboardContainer: { flex: 1, backgroundColor: '#F7FAFC', padding: 20, paddingTop: 50 },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2D3748', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#718096', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#4A5568', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  buttonAction: { flex: 1, backgroundColor: '#EDF2F7', padding: 12, borderRadius: 6, alignItems: 'center', marginRight: 5 },
  buttonActionDark: { flex: 1, backgroundColor: '#2D3748', padding: 12, borderRadius: 6, alignItems: 'center', marginLeft: 5 },
  
  listContainer: { flex: 1 },
  rankCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EDF2F7' },
  rankCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2B6CB0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rankText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  rankInfo: { flex: 1 },
  welderName: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginBottom: 4 },
  dataText: { fontSize: 13, color: '#718096', fontWeight: '500' },
  
  detailCard: { backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#EDF2F7', paddingBottom: 15 },
  detailName: { fontSize: 22, fontWeight: '800', color: '#2D3748' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  badgeSuccess: { backgroundColor: '#C6F6D5' },
  badgeWarning: { backgroundColor: '#FED7D7' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#2D3748' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridBox: { width: '48%', backgroundColor: '#F7FAFC', padding: 15, borderRadius: 6, marginBottom: 15, borderWidth: 1, borderColor: '#EDF2F7' },
  gridLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '700', marginBottom: 5 },
  gridValue: { fontSize: 18, fontWeight: '800', color: '#2D3748' },
  alertBox: { backgroundColor: '#FFF5F5', padding: 15, borderRadius: 6, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#FED7D7' },
  alertLabel: { fontSize: 12, color: '#E53E3E', fontWeight: '700', marginBottom: 5 },
  alertValue: { fontSize: 18, fontWeight: '800', color: '#C53030' },

  inputLabel: { fontSize: 12, fontWeight: '700', color: '#718096', marginBottom: 10, letterSpacing: 0.5 },
  input: { width: '100%', backgroundColor: '#F7FAFC', padding: 15, borderRadius: 6, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15, color: '#2D3748' },
  buttonPrimary: { width: '100%', backgroundColor: '#2B6CB0', padding: 15, borderRadius: 6, alignItems: 'center', marginBottom: 12 },
  buttonSecondary: { width: '100%', backgroundColor: '#EDF2F7', padding: 15, borderRadius: 6, alignItems: 'center' },
  buttonDetail: { backgroundColor: '#EDF2F7', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 4 },
  buttonOutline: { width: '100%', backgroundColor: '#EDF2F7', padding: 15, borderRadius: 6, alignItems: 'center' },
  buttonLogout: { padding: 15, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  buttonTextDark: { color: '#2D3748', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  buttonTextSmall: { color: '#2D3748', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  buttonTextSmallLight: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  buttonTextDanger: { color: '#E53E3E', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  buttonDetailText: { color: '#2B6CB0', fontSize: 12, fontWeight: '700' },
  
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#A0AEC0', marginBottom: 35, textTransform: 'uppercase', letterSpacing: 1 },
});


// npx expo start -c
// C:\Users\Mohamad abriansah\arata-dashboard\