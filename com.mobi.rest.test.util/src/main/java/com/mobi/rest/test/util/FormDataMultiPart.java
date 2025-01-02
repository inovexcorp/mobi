package com.mobi.rest.test.util;

/*-
 * #%L
 * com.mobi.rest.test.util
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.apache.commons.io.IOUtils;
import org.apache.cxf.jaxrs.ext.multipart.Attachment;
import org.apache.cxf.jaxrs.ext.multipart.ContentDisposition;
import org.apache.cxf.jaxrs.ext.multipart.MultipartBody;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class FormDataMultiPart {
    private static String HEADER_BOUNDARY = "----WebKitFormBoundary1YaRIEGtQ6thV5fA";
    private static String BOUNDARY = "--" + HEADER_BOUNDARY;
    private final List<Attachment> atts;

    public FormDataMultiPart() {
        this.atts = new LinkedList<>();
    }

    /**
     * Set a form data field with the given key and value.
     * @param key The key for the form data
     * @param value The value associated with the key
     * @return The FormDataMultiPart with the updated field value
     */
    public FormDataMultiPart field(String key, String value) {
        ContentDisposition contentDisposition = new ContentDisposition("form-data; name=\"" + key + "\";");
        atts.add(new Attachment(key, new ByteArrayInputStream(value.getBytes()), contentDisposition));
        return this;
    }

    /**
     * Set a form data field with a file attachment.
     *
     * @param filename The name of the file to add as an attachment
     * @param inputStream The {@link InputStream} of the file
     * @return The FormDataMultiPart with the updated field value
     */
    public FormDataMultiPart bodyPart(String field, String filename, InputStream inputStream) {
        ContentDisposition cd = new ContentDisposition("form-data; name=\"" + field + "\"; filename=\""
                + filename + "\"");
        Attachment att = new Attachment(field, inputStream, cd);
        atts.add(att);
        return this;
    }

    /**
     * Retrieves the {@link MultipartBody} from this FormDataMultiPart.
     *
     * @return A {@link MultipartBody} of the attachments set as fields
     */
    public MultipartBody body() {
        return new MultipartBody(atts);
    }

    /**
     * Creates an "empty" body.
     *
     * @return An "empty" MultipartBody
     */
    public static MultipartBody emptyBody() {
        return new MultipartBody(new Attachment("", ""));
    }

    /**
     * Creates a param map used for creating a content type with a boundary.
     *
     * @return A map containing the boundary string
     */
    public Map<String, String> getContentTypeParamMap() {
        Map<String, String> params = new HashMap<>();
        params.put("boundary", HEADER_BOUNDARY);
        return params;
    }

    @Override
    public String toString() {
        if (this.body().getAllAttachments().size() == 0) {
            return "";
        }
        try {
            StringBuilder sb = new StringBuilder();
            sb.append(BOUNDARY);
            sb.append("\r\n");
            for (Attachment att : this.body().getAllAttachments()) {
                ContentDisposition contDisp = att.getContentDisposition();
                Map<String, String> parameters = contDisp.getParameters();
                sb.append("Content-Disposition: ");
                sb.append(contDisp.getType());
                sb.append("; ");
                parameters.forEach((key, value) -> {
                    sb.append(key);
                    sb.append("=\"");
                    sb.append(value);
                    sb.append("\"");
                });
                sb.append("\r\n");
                sb.append("Content-Type: ");
                sb.append(att.getContentType().toString());
                sb.append("\r\n\r\n");
                sb.append(IOUtils.toString(att.getDataHandler().getInputStream(), StandardCharsets.UTF_8));
                sb.append("\r\n");
                sb.append(BOUNDARY);
            }
            sb.append("--\r\n");
            return sb.toString();
        } catch (IOException e) {
            return "";
        }
    }
}
