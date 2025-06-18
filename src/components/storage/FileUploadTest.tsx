
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, File, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  created_at: string;
}

const FileUploadTest = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      toast({
        title: "Upload failed",
        description: "Please select a file and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB.",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images, PDFs, and text files are allowed.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create file path organized by user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName);
      console.log('File size:', file.size);
      console.log('File type:', file.type);

      const { data, error } = await supabase.storage
        .from('customer-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('customer-uploads')
        .getPublicUrl(fileName);

      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        url: publicUrl,
        created_at: new Date().toISOString()
      };

      setUploadedFiles(prev => [newFile, ...prev]);

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleFileDelete = async (fileUrl: string, fileName: string) => {
    if (!user) return;

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // user_id/filename

      const { error } = await supabase.storage
        .from('customer-uploads')
        .remove([filePath]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(f => f.url !== fileUrl));

      toast({
        title: "File deleted",
        description: `${fileName} has been deleted successfully.`,
      });

    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message || "An error occurred during deletion.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>File Upload Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Please log in to test file uploads.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Secure File Upload Test
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test the enhanced storage policies with authentication and file limits.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Upload File (Max 10MB - Images, PDFs, Text files only)
          </label>
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            accept="image/*,.pdf,.txt"
          />
          {isUploading && (
            <p className="text-sm text-blue-600 mt-2">Uploading...</p>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Your Uploaded Files:</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <File className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileDelete(file.url, file.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-2">
          <p><strong>Security Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Files organized by user ID (/{user.id}/filename)</li>
            <li>10MB file size limit enforced</li>
            <li>Only specific file types allowed</li>
            <li>Only authenticated users can upload</li>
            <li>Users can only delete their own files</li>
            <li>Public read access for customer photos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadTest;
