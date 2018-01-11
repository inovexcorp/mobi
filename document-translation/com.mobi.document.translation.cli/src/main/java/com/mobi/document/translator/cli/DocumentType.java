package com.mobi.document.translator.cli;

import javax.print.Doc;
import java.util.Arrays;
import java.util.Optional;

public enum DocumentType {

    JSON("json"), XML();

    private final String[] extensions;

    private DocumentType(String... extensions){
        this.extensions = extensions;
    }

    public String[] getExtensions() {
        return extensions;
    }

    public boolean containsExtension(String ext){
        return Arrays.stream(extensions).anyMatch(extension -> extension.equalsIgnoreCase(ext));
    }

    public static Optional<DocumentType> getTypeFromFileExtension(String extension){
        return Arrays.stream(DocumentType.values()).filter(type -> type.containsExtension(extension)).findFirst();
    }
}
