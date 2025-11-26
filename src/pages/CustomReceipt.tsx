import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Download, Send, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReceiptItem {
  id: string;
  item: string;
  quantity: number;
  nominal: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

interface ReceiptSettings {
  receiverName: string;
  customDate: string;
  customTime: string;
}

const CustomReceipt = () => {
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [receiptNumber, setReceiptNumber] = useState(() => {
    const saved = localStorage.getItem('lastReceiptNumber');
    return saved ? `TRX${String(parseInt(saved.replace('TRX', '')) + 1).padStart(3, '0')}` : 'TRX001';
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: ''
  });
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: '1', item: '', quantity: 1, nominal: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    receiverName: 'DARWIS ASYUR',
    customDate: new Date().toISOString().split('T')[0],
    customTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
  });
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [stampFile, setStampFile] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);

  const generateNextReceiptNumber = () => {
    const currentNumber = parseInt(receiptNumber.replace('TRX', ''));
    const nextNumber = currentNumber + 1;
    const newReceiptNumber = `TRX${String(nextNumber).padStart(3, '0')}`;
    setReceiptNumber(newReceiptNumber);
    localStorage.setItem('lastReceiptNumber', newReceiptNumber);
    return newReceiptNumber;
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      item: '',
      quantity: 1,
      nominal: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.nominal), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      setIsGenerating(true);
      
      // Simpan style asli
      const originalStyle = receiptRef.current.style.cssText;
      
      // Atur ukuran konten ke ukuran A4 untuk rendering
      // Ukuran A4 dalam mm: 210mm x 297mm
      // Konversi ke piksel dengan asumsi 96 DPI: ~793px x ~1123px
      receiptRef.current.style.width = '793px';
      receiptRef.current.style.minHeight = '1123px';
      receiptRef.current.style.maxHeight = 'none';
      receiptRef.current.style.margin = '0';
      receiptRef.current.style.padding = '30px';
      receiptRef.current.style.boxSizing = 'border-box';
      
      // Render dengan ukuran A4
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Kualitas tinggi
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 793,
        windowHeight: 1123
      });
      
      // Kembalikan style asli
      receiptRef.current.style.cssText = originalStyle;
      
      // Buat PDF dengan ukuran A4 standar
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Ukuran A4 dalam mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Konversi canvas ke gambar
      const imgData = canvas.toDataURL('image/png');
      
      // Hitung rasio untuk memastikan gambar sesuai dengan ukuran A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Tambahkan gambar ke PDF dengan ukuran yang tepat
      let heightLeft = imgHeight;
      let position = 0;
      
      // Halaman pertama
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // Tambahkan halaman tambahan jika konten terlalu panjang
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      // Simpan PDF
      pdf.save(`Nota-${receiptNumber}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `Nota ${receiptNumber} berhasil didownload`,
      });
      
      generateNextReceiptNumber();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Gagal membuat PDF",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendViaWAHA = async () => {
    if (!customerInfo.phone) {
      toast({
        title: "Error",
        description: "Nomor telepon pelanggan harus diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      if (!receiptRef.current) return;

      // Simpan style asli
      const originalStyle = receiptRef.current.style.cssText;
      
      // Atur ukuran konten ke ukuran A4 untuk rendering
      receiptRef.current.style.width = '793px';
      receiptRef.current.style.minHeight = '1123px';
      receiptRef.current.style.maxHeight = 'none';
      receiptRef.current.style.margin = '0';
      receiptRef.current.style.padding = '30px';
      receiptRef.current.style.boxSizing = 'border-box';

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 793,
        windowHeight: 1123
      });
      
      // Kembalikan style asli
      receiptRef.current.style.cssText = originalStyle;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Ukuran A4 dalam mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Hitung rasio untuk memastikan gambar sesuai dengan ukuran A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Tambahkan gambar ke PDF dengan ukuran yang tepat
      let heightLeft = imgHeight;
      let position = 0;
      
      // Halaman pertama
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // Tambahkan halaman tambahan jika konten terlalu panjang
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      
      const formData = new FormData();
      formData.append('chatId', `${customerInfo.phone}@c.us`);
      formData.append('file', pdfBlob, `Nota-${receiptNumber}.pdf`);
      formData.append('caption', `Nota pembayaran ${receiptNumber}\n\nTerima kasih atas pembayaran Anda.\n\nLatansa Networks`);
      
      const response = await fetch('/api/waha/sendFile', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        toast({
          title: "Berhasil Dikirim",
          description: `Nota ${receiptNumber} berhasil dikirim ke ${customerInfo.phone}`,
        });
        generateNextReceiptNumber();
      } else {
        throw new Error('Failed to send via WAHA');
      }
    } catch (error) {
      console.error('Error sending via WAHA:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim nota via WhatsApp",
        variant: "destructive"
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'stamp' | 'signature') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        switch (type) {
          case 'logo':
            setLogoFile(result);
            break;
          case 'stamp':
            setStampFile(result);
            break;
          case 'signature':
            setSignatureFile(result);
            break;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Nota Lainnya</h1>
        <Button onClick={generateNextReceiptNumber} variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Generate Nomor Nota
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Input */}
        <div className="space-y-6">
          {/* Receipt Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Nota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="receiptNumber">Nomor Nota</Label>
                <Input
                  id="receiptNumber"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="TRX001"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Nama Pelanggan</Label>
                <Input
                  id="customerName"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  placeholder="Nama pelanggan"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Nomor Telepon</Label>
                <Input
                  id="customerPhone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Alamat</Label>
                <Textarea
                  id="customerAddress"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  placeholder="Alamat pelanggan"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Item Transaksi</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Item {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        onClick={() => removeItem(item.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Input
                      value={item.item}
                      onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                      placeholder="Deskripsi item"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Jumlah</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Harga Satuan</Label>
                      <Input
                        type="number"
                        value={item.nominal}
                        onChange={(e) => updateItem(item.id, 'nominal', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Input
                      value={formatCurrency(item.quantity * item.nominal)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Receipt Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Nota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="receiverName">Nama Penerima</Label>
                <Input
                  id="receiverName"
                  value={receiptSettings.receiverName}
                  onChange={(e) => setReceiptSettings({...receiptSettings, receiverName: e.target.value})}
                  placeholder="Nama penerima"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customDate">Tanggal</Label>
                  <Input
                    id="customDate"
                    type="date"
                    value={receiptSettings.customDate}
                    onChange={(e) => setReceiptSettings({...receiptSettings, customDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="customTime">Waktu</Label>
                  <Input
                    id="customTime"
                    type="time"
                    value={receiptSettings.customTime}
                    onChange={(e) => setReceiptSettings({...receiptSettings, customTime: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo & Signature */}
          <Card>
            <CardHeader>
              <CardTitle>Logo & Tanda Tangan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logoUpload">Upload Logo Perusahaan</Label>
                <Input
                   id="logoUpload"
                   type="file"
                   accept="image/*"
                   className="mt-1"
                   onChange={(e) => handleFileUpload(e, 'logo')}
                 />
                <p className="text-xs text-gray-500 mt-1">
                  Format yang didukung: JPG, PNG, SVG. Ukuran maksimal: 2MB
                </p>
              </div>
              <div>
                <Label htmlFor="stampUpload">Upload Stempel</Label>
                <Input
                   id="stampUpload"
                   type="file"
                   accept="image/*"
                   className="mt-1"
                   onChange={(e) => handleFileUpload(e, 'stamp')}
                 />
                <p className="text-xs text-gray-500 mt-1">
                  Upload gambar stempel untuk ditampilkan di area tanda tangan
                </p>
              </div>
              <div>
                <Label htmlFor="signatureUpload">Upload Tanda Tangan</Label>
                <Input
                   id="signatureUpload"
                   type="file"
                   accept="image/*"
                   className="mt-1"
                   onChange={(e) => handleFileUpload(e, 'signature')}
                 />
                <p className="text-xs text-gray-500 mt-1">
                  Upload gambar tanda tangan penerima
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Catatan</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan (opsional)"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={downloadPDF}
              disabled={isGenerating || !receiptNumber || !customerInfo.name}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button
              onClick={sendViaWAHA}
              disabled={!receiptNumber || !customerInfo.name || !customerInfo.phone}
              variant="outline"
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              Kirim via WhatsApp
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Preview Nota</h2>
          <div className="border rounded-lg p-1 bg-white">
            <div ref={receiptRef} className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                 <div className="flex items-start">
                   <div className="w-12 h-12 md:w-20 md:h-20 flex items-center justify-center mr-2 md:mr-4">
                     {logoFile ? (
                       <img src={logoFile} alt="Logo" className="w-full h-full object-contain" />
                     ) : (
                       <img src="/logo.png" alt="Latansa Networks Logo" className="w-full h-full object-contain" />
                     )}
                   </div>
                   <div>
                     <h1 className="text-xl font-bold text-blue-600 mb-1">LATANSA NETWORKS</h1>
                     <p className="text-xs text-gray-600">Terkoneksi Tanpa Batas, Menghadirkan Dunia Diujung Jari</p>
                     <p className="text-xs text-gray-600">Berkat Usaha, Seberang Pebenaan, Keritang</p>
                     <p className="text-xs text-gray-600">Indragiri Hilir, Telp 085256372504</p>
                     <p className="text-xs text-red-600">support@latansa.my.id</p>
                   </div>
                 </div>
                 <div className="text-right">
                    <h2 className="text-2xl font-bold mb-2">Invoice #{receiptNumber}</h2>
                    <p className="text-sm text-gray-600">Tanggal: {receiptSettings.customDate} {receiptSettings.customTime}</p>
                  </div>
               </div>

              {/* Customer Info & Status */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <p className="text-sm mb-2">Kepada,</p>
                  <p className="font-bold text-lg">{customerInfo.name?.toUpperCase() || 'NAMA PELANGGAN'}</p>
                  <p className="text-sm text-gray-600">Telp: {customerInfo.phone || 'Nomor Telepon'}</p>
                  <p className="text-sm text-gray-600">{customerInfo.address || 'Alamat Pelanggan'}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-3xl font-bold text-green-600 mt-4">L U N A S</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-gray-200">
                       <th className="border border-gray-400 p-3 text-center font-bold">No</th>
                       <th className="border border-gray-400 p-3 text-center font-bold">Deskripsi</th>
                       <th className="border border-gray-400 p-3 text-center font-bold">Harga</th>
                       <th className="border border-gray-400 p-3 text-center font-bold">Qty</th>
                       <th className="border border-gray-400 p-3 text-center font-bold">Total</th>
                     </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-gray-400 p-3 text-center">{index + 1}</td>
                        <td className="border border-gray-400 p-3">{item.item || 'Item'}</td>
                        <td className="border border-gray-400 p-3 text-right">Rp {item.nominal.toLocaleString('id-ID')}</td>
                        <td className="border border-gray-400 p-3 text-center">{item.quantity}</td>
                        <td className="border border-gray-400 p-3 text-right">Rp {(item.quantity * item.nominal).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Grand Total */}
                <table className="w-full border-collapse border border-gray-400 mt-0">
                  <tr>
                    <td className="border border-gray-400 p-3 text-right font-bold bg-gray-100" style={{ width: '83.33%' }}>Grand Total</td>
                    <td className="border border-gray-400 p-3 text-right font-bold bg-gray-100">Rp {calculateTotal().toLocaleString('id-ID')}</td>
                  </tr>
                </table>
              </div>

              {/* Notes */}
              {notes && (
                <div className="mb-8">
                  <h3 className="font-bold mb-2">Keterangan</h3>
                  <p className="text-sm text-gray-600">{notes}</p>
                </div>
              )}

              {/* Spacer */}
              <div className="mb-8"></div>

              {/* Signature */}
               <div className="flex justify-between mt-16">
                 <div className="text-center flex-1">
                   <p className="mb-4">Penyetor,</p>
                   <div className="h-20 mb-4 flex items-center justify-center">
                     {/* Area untuk tanda tangan penyetor */}
                   </div>
                   <p className="font-bold">( {customerInfo.name?.toUpperCase() || 'NAMA PELANGGAN'} )</p>
                 </div>
                 <div className="text-center flex-1">
                   <p className="mb-4">Penerima,</p>
                   <div className="h-20 mb-4 flex items-center justify-center relative">
                     {stampFile ? (
                       <img src={stampFile} alt="Stempel" className="absolute w-20 h-20 object-contain opacity-80" style={{left: '50px'}} />
                     ) : (
                       <img src="/logostamp.png" alt="Stempel Default" className="absolute w-20 h-20 object-contain opacity-80" style={{left: '50px'}} />
                     )}
                     {signatureFile && (
                       <img src={signatureFile} alt="Tanda Tangan" className="w-20 h-12 object-contain" />
                     )}
                   </div>
                   <p className="font-bold">( {receiptSettings.receiverName.toUpperCase()} )</p>
                 </div>
               </div>

              {/* Payment Info */}
              <div className="mt-12 text-sm text-gray-700">
                <p className="mb-1">Rekening pembayaran transfer Bank :</p>
                <p className="font-bold">BRI: 557501007609530 an DARWIS ASYUR</p>
                <p className="font-bold">BNI 46: 0285411186 an DARWIS ASYUR</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomReceipt;