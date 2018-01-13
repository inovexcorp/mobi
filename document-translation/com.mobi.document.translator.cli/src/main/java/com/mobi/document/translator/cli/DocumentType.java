package com.mobi.document.translator.cli;

/*-
 * #%L
 * com.mobi.document.translation.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

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
