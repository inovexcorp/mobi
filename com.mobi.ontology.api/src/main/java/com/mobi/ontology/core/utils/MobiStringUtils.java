package com.mobi.ontology.core.utils;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import org.apache.commons.lang3.StringUtils;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import javax.annotation.Nonnull;

public class MobiStringUtils {

    /**
     * Obtains content of URL to String.
     */
    public static String urlToText(@Nonnull String url) throws Exception {
        URL website = new URL(url);
        URLConnection connection = website.openConnection();
        BufferedReader in = new BufferedReader(
                                new InputStreamReader(
                                    connection.getInputStream()));

        StringBuilder response = new StringBuilder();
        String inputLine;

        while ((inputLine = in.readLine()) != null) {
            response.append(inputLine + "\n");
        }
        in.close();

        return response.toString();
    }


    /**
     * Converts InputStream to String.
     */
    public static String inputStreamToText(@Nonnull InputStream inputStream) {
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int length;
        try {
            while ((length = inputStream.read(buffer)) != -1) {
                result.write(buffer, 0, length);
            }
            return result.toString(StandardCharsets.UTF_8.name());
        } catch (IOException e) {
            throw new MobiOntologyException("Error converting input stream to string!", e);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }


    /*
     * Uses Regex to address the language tag issue in OWL2 RDF mapping  where
     * RDF-1.1 it is not allowed to have a datatype in the Turtle document
     * if you have a language. This one defaults the language tag to "@en"(English).
     */
    public static InputStream replaceLanguageTag(@Nonnull InputStream inputStream) {
        return replaceLanguageTag(inputStream, "en");
    }


    /**
     * Uses Regex to address the language tag issue in OWL2 RDF mapping  where
     * RDF-1.1 it is not allowed to have a datatype in the Turtle document
     * if you have a language.
     */
    public static InputStream replaceLanguageTag(@Nonnull InputStream inputStream, @Nonnull String languageSuffix) {
        InputStream result = null;
        String toReplace = "rdf:datatype=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#langString\"";
        String replaceWith = "xml:lang=\"" + languageSuffix + "\"";
        String content = StringUtils.replace(inputStreamToText(inputStream), toReplace, replaceWith);
        result = new ByteArrayInputStream(content.getBytes( ));
        return result;
    }


    public static OutputStream replaceLanguageTag(@Nonnull OutputStream outputStream) {
        return replaceLanguageTag(outputStream, "en");
    }

    /**
     * .
     */
    public static OutputStream replaceLanguageTag(@Nonnull OutputStream outputStream, @Nonnull String languageSuffix) {
        OutputStream result = new ByteArrayOutputStream();
        String toReplace = "rdf:datatype=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#langString\"";
        String replaceWith = "xml:lang=\"" + languageSuffix + "\"";
        String content = StringUtils.replace(outputStream.toString(), toReplace, replaceWith);
        try {
            result.write(content.getBytes(Charset.forName("UTF-8")));
        } catch (IOException e) {
            throw new MobiOntologyException("Error replacing language tag in output stream!", e);
        } finally {
            IOUtils.closeQuietly(outputStream);
        }

        return result;
    }


    /**
     * Removes OWLAPI signature at the end of ontology document.
     */
    public static OutputStream removeOWLGeneratorSignature(@Nonnull OutputStream outputStream) {
        OutputStream result = new ByteArrayOutputStream();
        String signature = "<\\!--.*?OWL API.*?-->|#\\##.*?OWL API.*";
        String content = StringUtils.replace(outputStream.toString(), signature,"");

        try {
            result.write(content.getBytes(Charset.forName("UTF-8")));
        } catch (IOException e) {
            throw new MobiOntologyException("Error removing owl generator signature!", e);
        } finally {
            IOUtils.closeQuietly(outputStream);
        }

        return result;
    }
}
