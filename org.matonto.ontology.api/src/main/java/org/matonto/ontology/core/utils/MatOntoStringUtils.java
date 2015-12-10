package org.matonto.ontology.core.utils;

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

import org.apache.commons.io.IOUtils;

public class MatOntoStringUtils {

	/*
	 * Obtains content of URL to String
	 */
	public static String urlToText(String url) throws Exception {
        URL website = new URL(url);
        URLConnection connection = website.openConnection();
        BufferedReader in = new BufferedReader(
                                new InputStreamReader(
                                    connection.getInputStream()));

        StringBuilder response = new StringBuilder();
        String inputLine;

        while ((inputLine = in.readLine()) != null) 
            response.append(inputLine+"\n");

        in.close();

        return response.toString();
	}
	
	/*
	 * Converts InputStream to String
	 */
	public static String InputStreamToText(InputStream is) {
		BufferedReader br = null;
		StringBuilder sb = new StringBuilder();

		String line;
		try {
			br = new BufferedReader(new InputStreamReader(is));
			while ((line = br.readLine()) != null) {
				sb.append(line+"\n");
			}
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			if (br != null) {
				try {
					br.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
				
			IOUtils.closeQuietly(is);
		}

		return sb.toString();
	}

	/*
	 * Uses Regex to address the language tag issue in OWL2 RDF mapping  where 
	 * RDF-1.1 it is not allowed to have a datatype in the Turtle document 
	 * if you have a language. This one defaults the language tag to "@en"(English).
	 */
	public static InputStream replaceLanguageTag(InputStream inputStream) {
		InputStream result = null;
		String toReplace = "rdf:datatype=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#langString\"";
		String replaceWith = "xml:lang=\"en\"";
		String content = InputStreamToText(inputStream);
		content = content.replaceAll(toReplace, replaceWith);
		result = new ByteArrayInputStream(content.getBytes( ));
		return result;
	}
	
	/*
	 * Uses Regex to address the language tag issue in OWL2 RDF mapping  where 
	 * RDF-1.1 it is not allowed to have a datatype in the Turtle document 
	 * if you have a language. 
	 */
	public static InputStream replaceLanguageTag(InputStream inputStream, String languageSuffix) {
		InputStream result = null;
		String toReplace = "rdf:datatype=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#langString\"";
		String replaceWith = "xml:lang=\"" + languageSuffix + "\"";
		String content = InputStreamToText(inputStream);
		content = content.replaceAll(toReplace, replaceWith);
		result = new ByteArrayInputStream(content.getBytes( ));
		return result;
	}
	
	
	public static OutputStream replaceLanguageTag(OutputStream outputStream) {
		OutputStream result = new ByteArrayOutputStream();
		String toReplace = "rdf:datatype=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#langString\"";
		String replaceWith = "xml:lang=\"en\"";
		String content = outputStream.toString();
		content = content.replaceAll(toReplace, replaceWith);
		try {
			result.write(content.getBytes(Charset.forName("UTF-8")));
			
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			IOUtils.closeQuietly(outputStream);
		}
		
		return result;
	}
	
	
	public static OutputStream replaceLanguageTag(OutputStream outputStream, String languageSuffix) {
		OutputStream result = new ByteArrayOutputStream();
		String toReplace = "rdf:datatype=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#langString\"";
		String replaceWith = "xml:lang=\"" + languageSuffix + "\"";
		String content = outputStream.toString();
		content = content.replaceAll(toReplace, replaceWith);
		try {
			result.write(content.getBytes(Charset.forName("UTF-8")));
			
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			IOUtils.closeQuietly(outputStream);
		}
		
		return result;
	}
	
	
	/*
	 * Removes OWLAPI signature at the end of ontology document 
	 */
	public static OutputStream removeOWLGeneratorSignature(OutputStream outputStream) {
		OutputStream result = new ByteArrayOutputStream();
		String signature = "<\\!--.*?OWL API.*?-->|#\\##.*?OWL API.*";
		String content = outputStream.toString();
		content = content.replaceAll(signature, "");

		try {
			result.write(content.getBytes(Charset.forName("UTF-8")));
			
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			IOUtils.closeQuietly(outputStream);
		}
		
		return result;
	}
}
